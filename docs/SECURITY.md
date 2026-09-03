# Platform Security, Threat Model & Privacy Standards

## 1. Threat Mitigation Framework

### A. Safe File Upload & Path Traversal Protection
- File uploads in `/datasets` are sanitized using `os.path.basename()` and assigned isolated UUID filenames.
- Extension and magic byte validation restrict uploads strictly to GIS formats (`.tif`, `.geojson`, `.shp`, `.zip`, `.csv`, `.nc`).
- Storage directories enforce boundary isolation.

### B. SQL & Spatial Injection Mitigation
- All database queries use SQLAlchemy 2.0 ORM parameterized bindings.
- Raw text queries are never constructed via direct string concatenation.

### C. Authentication & Secret Handling
- No credentials or private keys are hardcoded in source control.
- Google OAuth token validation is verified cryptographically.
- Tokens expire via standard JWT claims.

---

## 2. Citizen Privacy Policy
- Citizen mobile devices do not stream continuous location traces to backend servers.
- Ray-casting point-in-polygon risk evaluation executes locally on the user's mobile device CPU.
- Location data is never monetized or shared with third parties.
