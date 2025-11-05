# Paint-by-Numbers Application - Setup Guide

Complete guide to run your Paint-by-Numbers application locally or in production.

---

## 📋 Prerequisites

### Required Software
- **Docker** (20.10+) and **Docker Compose** (2.0+)
- **Git**
- **Python** 3.9+ (for local development without Docker)
- **Node.js** 16+ and **npm** (for frontend development)

### Check Installed Versions
```bash
docker --version
docker-compose --version
python3 --version
node --version
npm --version
```

---

## 🚀 Quick Start (Docker - Recommended)

### Step 1: Clone and Navigate to Project
```bash
cd /home/user/mine
git checkout claude/improve-code-quality-011CUpqwwcbs5uJY6YAkjfVq
cd webapp
```

### Step 2: Create Environment Configuration
```bash
cp .env.example .env
```

### Step 3: Edit .env File
Open `.env` and configure the following **REQUIRED** settings:

```bash
# IMPORTANT: Change these from defaults!
DB_PASSWORD=your_secure_database_password_here
SECRET_KEY=your-random-secret-key-at-least-32-characters-long

# Optional (can skip for local development)
# AWS_ACCESS_KEY_ID=your-aws-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret
# STRIPE_API_KEY=sk_test_your_key
# STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

**Generate a secure SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 4: Build and Start All Services
```bash
# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

**Expected output:**
```
NAME                        STATUS
paintbynumbers-backend      Up (healthy)
paintbynumbers-celery       Up
paintbynumbers-db           Up (healthy)
paintbynumbers-frontend     Up
paintbynumbers-redis        Up (healthy)
```

### Step 5: Initialize Database
```bash
# Run database initialization script
docker-compose exec backend python -m app.db.init_db
```

**Expected output:**
```
============================================================
DATABASE INITIALIZATION
============================================================
Creating database tables...
✓ Tables created successfully
✓ Seeded X standard products
✓ Seeded X kit bundles
✓ Initialized inventory for X products
============================================================
✓ DATABASE INITIALIZATION COMPLETE
============================================================
```

### Step 6: Apply Database Migration (For Code Quality Improvements)
```bash
# Add the new error_message column
docker-compose exec backend python -c "
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text('ALTER TABLE templates ADD COLUMN error_message VARCHAR NULL'))
        conn.commit()
        print('✓ Migration successful: error_message column added')
    except Exception as e:
        if 'already exists' in str(e) or 'duplicate column' in str(e).lower():
            print('✓ Column already exists, skipping')
        else:
            print(f'❌ Migration failed: {e}')
"
```

### Step 7: Verify Application is Running

**Backend API:**
```bash
curl http://localhost:8000/api/v1/health || echo "Backend not ready yet"
```

**Frontend:**
```bash
curl http://localhost:3000 -I | head -n 1
```

**View Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery_worker
```

### Step 8: Access the Application

🌐 **Frontend:** http://localhost:3000
🔌 **Backend API:** http://localhost:8000
📚 **API Docs:** http://localhost:8000/docs (Swagger UI)
📊 **Alternative API Docs:** http://localhost:8000/redoc

---

## 🛠️ Local Development (Without Docker)

### Backend Setup

#### 1. Create Virtual Environment
```bash
cd /home/user/mine/webapp/backend
python3 -m venv venv
source venv/bin/activate
```

#### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 3. Install Paint-by-Numbers Core Library
```bash
cd /home/user/mine
pip install -e paint_by_numbers/
```

#### 4. Set Environment Variables
```bash
export DATABASE_URL="postgresql://paintuser:changeme@localhost:5432/paintbynumbers"
export REDIS_URL="redis://localhost:6379/0"
export SECRET_KEY="your-secret-key-at-least-32-chars"
export ENVIRONMENT="development"
export UPLOAD_DIR="/tmp/paintbynumbers/uploads"
export CORS_ORIGINS='["http://localhost:3000"]'
```

#### 5. Start PostgreSQL and Redis
```bash
# Start just database and redis
cd webapp
docker-compose up -d db redis
```

#### 6. Initialize Database
```bash
cd /home/user/mine/webapp/backend
python -m app.db.init_db
```

#### 7. Start Backend Server
```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 8. Start Celery Worker (Separate Terminal)
```bash
cd /home/user/mine/webapp/backend
source venv/bin/activate
celery -A app.core.celery_app worker --loglevel=info
```

### Frontend Setup

#### 1. Install Dependencies
```bash
cd /home/user/mine/webapp/frontend
npm install
```

#### 2. Configure API URL
Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 3. Start Development Server
```bash
npm run dev
```

Frontend will be available at: http://localhost:3000

---

## 🧪 Testing the Application

### Test Template Generation

#### Using cURL:
```bash
# Create a test image (or use your own)
curl -X POST http://localhost:8000/api/v1/templates/generate \
  -F "file=@/path/to/your/image.jpg" \
  -F "palette_name=classic_18" \
  -F "model=classic" \
  -F "num_colors=18" \
  -F "title=Test Template"
```

#### Using Frontend:
1. Navigate to http://localhost:3000
2. Click "Create Template"
3. Upload an image
4. Select options (palette, model, colors)
5. Generate template

### Test Input Validation (New Feature)

```bash
# Test file size limit (should fail with files > 50MB)
# Test invalid file type (should reject non-images)
# Test invalid num_colors (should reject < 5 or > 30)

# Test with invalid num_colors
curl -X POST http://localhost:8000/api/v1/templates/generate \
  -F "file=@image.jpg" \
  -F "num_colors=100"
# Expected: 400 Bad Request - "num_colors must be between 5 and 30"
```

### View Available Palettes
```bash
curl http://localhost:8000/api/v1/templates/palettes/list | jq
```

### View Available Models
```bash
curl http://localhost:8000/api/v1/templates/models/list | jq
```

---

## 📊 Monitoring and Logs

### View Docker Logs
```bash
# All services
docker-compose logs -f

# Specific services
docker-compose logs -f backend
docker-compose logs -f celery_worker
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Check Service Health
```bash
# Backend health check
curl http://localhost:8000/health

# Database connection
docker-compose exec backend python -c "
from app.core.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text('SELECT 1'))
    print('✓ Database connection OK')
"

# Redis connection
docker-compose exec redis redis-cli ping
```

### View Database
```bash
# Connect to PostgreSQL
docker-compose exec db psql -U paintuser -d paintbynumbers

# List tables
\dt

# View templates
SELECT id, title, difficulty_level, error_message FROM templates LIMIT 10;

# Exit
\q
```

---

## 🔧 Troubleshooting

### Problem: Backend won't start
**Solution:**
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait a few seconds and check again
# 2. Port 8000 already in use
sudo lsof -i :8000
# Kill process using the port or change port in docker-compose.yml

# 3. SECRET_KEY validation error
# Make sure .env has a proper SECRET_KEY
```

### Problem: Database connection error
**Solution:**
```bash
# Ensure database is healthy
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Wait for health check
docker-compose ps
```

### Problem: Template generation fails
**Solution:**
```bash
# Check celery worker logs
docker-compose logs celery_worker

# Check backend logs for generation errors
docker-compose logs backend | grep "Error generating template"

# Verify Redis is running
docker-compose ps redis

# Check error_message in database
docker-compose exec db psql -U paintuser -d paintbynumbers -c "SELECT id, title, error_message FROM templates WHERE difficulty_level = 'error';"
```

### Problem: Frontend can't reach backend
**Solution:**
```bash
# Check if backend is accessible
curl http://localhost:8000/api/v1/health

# Check frontend environment
docker-compose exec frontend env | grep API_URL

# Verify CORS settings in .env
# Should include: http://localhost:3000
```

### Problem: "Image too large" errors
**Solution:**
This is expected behavior from the new improvements. The limits are:
- File size: 50MB max
- Image dimensions: 10,000 x 10,000 pixels max
- Memory usage: Warning at 300MB

To process larger images:
1. Resize the image before uploading
2. Or modify limits in `paint_by_numbers/core/image_processor.py`

### Problem: Permission denied errors
**Solution:**
```bash
# Fix upload directory permissions
docker-compose exec backend mkdir -p /tmp/uploads
docker-compose exec backend chmod 777 /tmp/uploads

# Or set proper ownership
docker-compose exec backend chown -R www-data:www-data /tmp/uploads
```

---

## 🔄 Common Commands

### Start/Stop Services
```bash
# Start all
docker-compose up -d

# Stop all
docker-compose down

# Stop and remove volumes (⚠️ deletes data!)
docker-compose down -v

# Restart specific service
docker-compose restart backend
```

### View Service Status
```bash
docker-compose ps
docker-compose top
```

### Rebuild After Code Changes
```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
```

### Database Operations
```bash
# Backup database
docker-compose exec db pg_dump -U paintuser paintbynumbers > backup.sql

# Restore database
docker-compose exec -T db psql -U paintuser paintbynumbers < backup.sql

# Reset database (⚠️ deletes all data!)
docker-compose exec backend python -m app.db.init_db --reset
```

### Clean Up
```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune -a

# Remove all (containers, volumes, networks)
docker-compose down -v --remove-orphans
```

---

## 🌐 Production Deployment

### 1. Set Environment to Production
```bash
export ENVIRONMENT=production
```

### 2. Update .env for Production
```bash
# Use strong secrets
SECRET_KEY=<64-character-random-string>
DB_PASSWORD=<strong-database-password>

# Configure external services
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
S3_BUCKET_NAME=<your-bucket>
STRIPE_API_KEY=<live-key>

# Update CORS for your domain
CORS_ORIGINS='["https://yourdomain.com"]'

# Update API URL
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 3. Enable SSL/TLS
- Add SSL certificates to `webapp/nginx/ssl/`
- Update `webapp/nginx/nginx.conf` with your domain

### 4. Start with Production Profile
```bash
docker-compose --profile production up -d
```

### 5. Set Up Backups
```bash
# Add to crontab
0 2 * * * docker-compose exec db pg_dump -U paintuser paintbynumbers | gzip > /backup/db_$(date +\%Y\%m\%d).sql.gz
```

---

## 📚 Additional Resources

- **API Documentation:** http://localhost:8000/docs
- **Code Quality Improvements:** See `CODE_QUALITY_IMPROVEMENTS.md`
- **Business Documentation:** See `BUSINESS_README.md`
- **Buyer Issues:** See `BUYER-PERSPECTIVE-ISSUES.md`

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend accessible at http://localhost:8000
- [ ] Frontend accessible at http://localhost:3000
- [ ] API docs at http://localhost:8000/docs
- [ ] Database initialized (products, kits, inventory)
- [ ] Can upload and generate template
- [ ] Celery worker processing tasks
- [ ] Redis cache working
- [ ] Error messages stored in database
- [ ] Input validation rejecting invalid files
- [ ] Configuration validation working (SECRET_KEY check)

---

## 🆘 Get Help

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify all services are healthy: `docker-compose ps`
3. Review this guide's Troubleshooting section
4. Check `CODE_QUALITY_IMPROVEMENTS.md` for recent changes

---

**Last Updated:** 2025-11-05
**Version:** With Code Quality Improvements
