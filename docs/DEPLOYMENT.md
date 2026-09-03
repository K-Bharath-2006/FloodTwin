# Production Deployment & Docker Orchestration Guide

## 1. Multi-Container Docker Architecture

```yaml
version: '3.8'

services:
  postgis:
    image: postgis/postgis:16-3.4
    ports: ["5432:5432"]
    volumes: [postgis_data:/var/lib/postgresql/data]

  redis:
    image: redis:7.2-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/data]

  backend:
    build: { context: ., dockerfile: docker/Dockerfile.backend }
    ports: ["8000:8000"]
    depends_on: [postgis, redis]

  worker:
    build: { context: ., dockerfile: docker/Dockerfile.backend }
    command: python -m backend.app.jobs.worker
    depends_on: [postgis, redis]

  frontend:
    build: { context: ., dockerfile: docker/Dockerfile.frontend }
    ports: ["3000:80"]
    depends_on: [backend]
```

---

## 2. Production Deployment Steps
1. Configure production environment variables in `.env`:
   ```bash
   cp .env.example .env
   # Update SECRET_KEY, DATABASE_URL, and Solver Paths
   ```

2. Build and launch containers:
   ```bash
   docker compose up --build -d
   ```

3. Run database migrations:
   ```bash
   docker compose exec backend python -m backend.app.db_init
   ```

4. Seed Indian dam baseline dataset:
   ```bash
   docker compose exec backend python scripts/setup_demo_data.py
   ```

5. Verify running services:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```
