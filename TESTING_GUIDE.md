# Testing Guide - Quick & Easy

Complete guide to test your Paint-by-Numbers application easily.

---

## 🚀 Method 1: Automated Test Script (EASIEST)

Run the comprehensive test script that tests everything:

```bash
cd /home/user/mine
./test_application.sh
```

**This will automatically test:**
- ✅ All Docker services are running
- ✅ Backend, database, Redis health
- ✅ API endpoints work
- ✅ Input validation (new feature)
- ✅ Template generation
- ✅ Configuration security (new feature)
- ✅ Error message storage (new feature)
- ✅ Logging improvements (new feature)

**Expected output:**
```
============================================
Paint-by-Numbers Application Test Suite
============================================

✓ PASS: Docker services are running
✓ PASS: Backend health check
✓ PASS: Database connection
✓ PASS: Redis connection
...
============================================
Test Results Summary
============================================
Total Tests: 15
Passed: 15
Failed: 0

🎉 All tests passed! Your application is working correctly.
```

---

## 🖱️ Method 2: Manual Testing (Step-by-Step)

### Step 1: Check Services are Running
```bash
cd /home/user/mine/webapp
docker-compose ps
```

**Expected:** All services show "Up" and database/redis show "(healthy)"

---

### Step 2: Test Backend API
```bash
# Simple health check
curl http://localhost:8000/api/v1/health

# View API documentation
open http://localhost:8000/docs
# Or visit in browser: http://localhost:8000/docs
```

**Expected:** Returns `{"status":"ok"}` or similar

---

### Step 3: Test Template Generation

#### Using curl:
```bash
cd /home/user/mine

# Generate a template with valid parameters
curl -X POST http://localhost:8000/api/v1/templates/generate \
  -F "file=@paint_by_numbers/test.jpg" \
  -F "palette_name=classic_18" \
  -F "model=classic" \
  -F "num_colors=18" \
  -F "title=My Test Template"
```

**Expected:** JSON response with template ID
```json
{
  "id": 1,
  "title": "My Test Template",
  "palette_name": "classic_18",
  "num_colors": 18,
  "model": "classic",
  ...
}
```

#### Save the template ID and check status:
```bash
# Replace {id} with the ID from above
curl http://localhost:8000/api/v1/templates/{id}
```

---

### Step 4: Test Input Validation (NEW FEATURE)

#### Test 1: Invalid num_colors (should FAIL)
```bash
curl -X POST http://localhost:8000/api/v1/templates/generate \
  -F "file=@paint_by_numbers/test.jpg" \
  -F "num_colors=100" \
  -F "title=Should Fail"
```

**Expected:** Error message
```json
{
  "detail": "num_colors must be between 5 and 30"
}
```

#### Test 2: Invalid palette (should FAIL)
```bash
curl -X POST http://localhost:8000/api/v1/templates/generate \
  -F "file=@paint_by_numbers/test.jpg" \
  -F "palette_name=fake_palette" \
  -F "title=Should Fail"
```

**Expected:** Error about invalid palette

#### Test 3: Invalid model (should FAIL)
```bash
curl -X POST http://localhost:8000/api/v1/templates/generate \
  -F "file=@paint_by_numbers/test.jpg" \
  -F "model=fake_model" \
  -F "title=Should Fail"
```

**Expected:** Error about invalid model

#### Test 4: Create a large fake file (should FAIL)
```bash
# Create a 60MB file (exceeds 50MB limit)
dd if=/dev/zero of=/tmp/large_file.jpg bs=1M count=60

curl -X POST http://localhost:8000/api/v1/templates/generate \
  -F "file=@/tmp/large_file.jpg" \
  -F "title=Should Fail"
```

**Expected:** Error about file size exceeding 50MB

---

### Step 5: Test Error Tracking (NEW FEATURE)

```bash
# Check database for error messages
docker-compose exec db psql -U paintuser -d paintbynumbers -c \
  "SELECT id, title, difficulty_level, error_message FROM templates WHERE error_message IS NOT NULL LIMIT 5;"
```

**Expected:** Shows any templates that had errors with error messages

---

### Step 6: View Available Options

#### List all palettes:
```bash
curl http://localhost:8000/api/v1/templates/palettes/list | jq
```

#### List all models:
```bash
curl http://localhost:8000/api/v1/templates/models/list | jq
```

#### List all templates:
```bash
curl http://localhost:8000/api/v1/templates/ | jq
```

---

## 🌐 Method 3: Frontend Testing (Browser)

### Step 1: Open Frontend
```bash
# Open in browser
open http://localhost:3000
# Or visit: http://localhost:3000
```

### Step 2: Test Template Creation
1. Click "Create Template" or "Upload Image"
2. Select an image file (use `paint_by_numbers/test.jpg`)
3. Choose options:
   - Palette: Classic 18
   - Model: Classic
   - Colors: 18
4. Click "Generate"

### Step 3: Verify Results
- Check that template appears in your dashboard
- View the generated template
- Download PDF if available

### Step 4: Test Invalid Inputs (Browser)
Try these to verify validation:
1. Upload a non-image file (should reject)
2. Try to set colors to 100 (should show error)
3. Upload a very large file >50MB (should reject)

---

## 🔍 Method 4: Check Logs

### View all logs:
```bash
docker-compose logs -f
```

### View specific service logs:
```bash
# Backend logs (should show proper logging, not print statements)
docker-compose logs -f backend

# Celery worker logs
docker-compose logs -f celery_worker

# Database logs
docker-compose logs -f db
```

### Check for errors:
```bash
# Search for error logs
docker-compose logs backend | grep -i error

# Search for template generation logs
docker-compose logs backend | grep "generating template"
```

---

## 📊 Method 5: Database Inspection

### Connect to database:
```bash
docker-compose exec db psql -U paintuser -d paintbynumbers
```

### Run queries:
```sql
-- View all templates
SELECT id, title, difficulty_level, num_colors, created_at FROM templates ORDER BY created_at DESC LIMIT 10;

-- View templates with errors (NEW FEATURE)
SELECT id, title, error_message FROM templates WHERE difficulty_level = 'error';

-- View template statistics
SELECT
  difficulty_level,
  COUNT(*) as count,
  AVG(num_colors) as avg_colors
FROM templates
GROUP BY difficulty_level;

-- Exit
\q
```

---

## ✅ Quick Health Check Checklist

Run these commands to verify everything is working:

```bash
# 1. Services running?
docker-compose ps

# 2. Backend healthy?
curl -f http://localhost:8000/api/v1/health

# 3. Can generate template?
curl -X POST http://localhost:8000/api/v1/templates/generate \
  -F "file=@paint_by_numbers/test.jpg" \
  -F "model=classic"

# 4. Frontend accessible?
curl -I http://localhost:3000

# 5. Database working?
docker-compose exec db psql -U paintuser -d paintbynumbers -c "SELECT COUNT(*) FROM templates;"
```

---

## 🎯 Testing the New Improvements

### Test 1: Bare Exception Handling Fixed ✅
**What changed:** No more silent failures
**How to test:** Check logs when template generation fails
```bash
docker-compose logs backend | grep -i "error"
```
You should see proper error messages with stack traces, not silent failures.

---

### Test 2: Input Validation ✅
**What changed:** All inputs are validated before processing
**How to test:** Try invalid inputs (see Step 4 above)

All these should return clear error messages:
- num_colors outside 5-30 range
- Invalid palette names
- Invalid model names
- Files >50MB
- Invalid file types

---

### Test 3: Security Configuration ✅
**What changed:** SECRET_KEY and database credentials are validated
**How to test:**
```bash
# This should warn if SECRET_KEY is weak
docker-compose logs backend | grep -i "secret"

# Check your SECRET_KEY length
docker-compose exec backend python -c "from app.core.config import settings; print(f'SECRET_KEY length: {len(settings.SECRET_KEY)}')"
```
Should be at least 32 characters.

---

### Test 4: Error Message Storage ✅
**What changed:** Errors are now stored in database for user visibility
**How to test:**
```bash
# Generate a template that will fail (use corrupted image or cause error)
# Then check database:
docker-compose exec db psql -U paintuser -d paintbynumbers -c \
  "SELECT id, title, error_message FROM templates WHERE error_message IS NOT NULL;"
```
You should see error messages stored for failed generations.

---

### Test 5: Database Session Management ✅
**What changed:** Using context managers for guaranteed cleanup
**How to test:** This is internal, but you can verify no connection leaks:
```bash
# Check active database connections
docker-compose exec db psql -U paintuser -d paintbynumbers -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname='paintbynumbers';"
```
Should be a reasonable number (not growing infinitely).

---

### Test 6: Logging Improvements ✅
**What changed:** Proper logging instead of print statements
**How to test:**
```bash
# Check backend logs have proper log levels
docker-compose logs backend | grep "INFO"
docker-compose logs backend | grep "ERROR"
docker-compose logs backend | grep "WARNING"
```
You should see structured log messages with timestamps, not raw print statements.

---

### Test 7: Image Processing Protection ✅
**What changed:** File size, dimension, and memory validation
**How to test:**

Create test files:
```bash
# Test 1: Large file (should reject)
dd if=/dev/zero of=/tmp/huge.jpg bs=1M count=60
curl -X POST http://localhost:8000/api/v1/templates/generate \
  -F "file=@/tmp/huge.jpg"
# Expected: Error about file size > 50MB

# Test 2: Check logs for memory warnings with large valid images
# Use a large but valid image and check logs:
docker-compose logs backend | grep -i "memory"
```

---

## 🐛 Common Test Issues

### Issue: Tests fail with connection error
**Solution:**
```bash
# Make sure services are running
docker-compose up -d
# Wait 30 seconds for services to be healthy
sleep 30
docker-compose ps
```

### Issue: Template generation times out
**Solution:**
```bash
# Check celery worker is running
docker-compose ps celery_worker

# Check celery logs
docker-compose logs celery_worker
```

### Issue: "Template not found" error
**Solution:**
```bash
# List all templates
curl http://localhost:8000/api/v1/templates/ | jq

# Check database directly
docker-compose exec db psql -U paintuser -d paintbynumbers -c "SELECT * FROM templates;"
```

---

## 📈 Performance Testing

### Test concurrent requests:
```bash
# Install apache bench if needed: apt-get install apache2-utils

# Test 10 concurrent health checks
ab -n 100 -c 10 http://localhost:8000/api/v1/health

# Test API response time
time curl http://localhost:8000/api/v1/templates/palettes/list
```

---

## 🎓 Next Steps After Testing

Once all tests pass:

1. ✅ Review test results
2. ✅ Check logs for any warnings
3. ✅ Test from browser (frontend)
4. ✅ Try different images and settings
5. ✅ Monitor resource usage: `docker stats`
6. ✅ Set up regular backups
7. ✅ Configure monitoring/alerting for production

---

## 📚 Additional Resources

- **Setup Guide:** `SETUP_GUIDE.md`
- **Code Improvements:** `CODE_QUALITY_IMPROVEMENTS.md`
- **API Documentation:** http://localhost:8000/docs
- **View Logs:** `docker-compose logs -f`

---

**Happy Testing! 🎨**

If tests fail, check the troubleshooting section in `SETUP_GUIDE.md` or run:
```bash
docker-compose logs backend
```
