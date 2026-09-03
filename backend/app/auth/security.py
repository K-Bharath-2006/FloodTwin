import datetime
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.user import User, UserRole

security_bearer = HTTPBearer(auto_error=False)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_google_id_token(token_str: str) -> Dict[str, Any]:
    """
    Validates Google OAuth ID token.
    If GOOGLE_CLIENT_ID is not configured in dev mode, decodes payload for testing.
    """
    if settings.GOOGLE_CLIENT_ID:
        try:
            idinfo = id_token.verify_oauth2_token(
                token_str, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
            return idinfo
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google OAuth token: {str(e)}"
            )
    else:
        # Development fallback token parser
        try:
            unverified_claims = jwt.get_unverified_claims(token_str)
            return unverified_claims
        except Exception:
            # Fallback mock user for testing/demo
            return {
                "sub": "google-demo-user-12345",
                "email": "demo.user@damflood.gov.in",
                "name": "Demo Hydrodynamic Modeller",
                "picture": "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
            }

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts and validates JWT Bearer token, returns database User.
    If no token is provided in local DEVELOPMENT mode, returns default admin user.
    """
    if not credentials:
        if settings.ENVIRONMENT == "DEVELOPMENT":
            admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
            if admin:
                return admin
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided."
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials.")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account.")
    return user

def require_role(allowed_roles: list):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {[r.value if hasattr(r, 'value') else r for r in allowed_roles]}"
            )
        return current_user
    return role_checker
