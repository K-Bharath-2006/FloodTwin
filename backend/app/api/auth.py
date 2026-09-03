from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.schemas.user import GoogleAuthRequest, TokenResponse, UserResponse
from backend.app.auth.security import verify_google_id_token, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/google", response_model=TokenResponse)
def login_with_google(auth_data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Validates Google OAuth ID token, authenticates or provisions citizen/modeller,
    and returns secure JWT access token.
    """
    idinfo = verify_google_id_token(auth_data.id_token)
    email = idinfo.get("email")
    google_sub = idinfo.get("sub")
    name = idinfo.get("name")
    picture = idinfo.get("picture")

    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token does not contain email.")

    user = db.query(User).filter((User.email == email) | (User.google_sub == google_sub)).first()
    if not user:
        # Auto-provision new user as CITIZEN by default (or MODELLER if gov email)
        role = UserRole.MODELLER if (email.endswith(".gov.in") or email.endswith("@gov.in")) else UserRole.CITIZEN
        user = User(
            email=email,
            full_name=name,
            google_sub=google_sub,
            picture_url=picture,
            role=role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.value})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
