# 🚀 RUN THE APP NOW - QUICK START GUIDE

**Goal:** Start the application and test everything works
**Time:** 10-15 minutes
**Date:** November 5, 2025

---

## 📋 STEP-BY-STEP COMMANDS

### **STEP 1: Navigate to Project** [10 seconds]

```bash
cd /home/user/mine/webapp
pwd  # Should show: /home/user/mine/webapp
```

---

### **STEP 2: Check Docker is Installed** [10 seconds]

```bash
docker --version
docker-compose --version
```

**Expected Output:**
```
Docker version 20.10.x or higher
docker-compose version 1.29.x or higher
```

**If not installed:**
- Docker is required to run the app
- You'll need to install Docker first

---

### **STEP 3: Create .env File** [30 seconds]

```bash
# Copy example env file
cp .env.example .env

# Verify it was created
ls -la .env
```

**Expected:** You should see `.env` file created

---

### **STEP 4: Start All Services** [1 minute]

```bash
# Stop any existing containers first
docker-compose down

# Start all services in detached mode
docker-compose up -d

# This will:
# - Build images (first time: 5-10 minutes)
# - Start database (PostgreSQL)
# - Start Redis
# - Start backend (FastAPI)
# - Start Celery worker
# - Start frontend (Next.js)
```

**Expected Output:**
```
Creating network "webapp_default" with the default driver
Creating paintbynumbers-db ... done
Creating paintbynumbers-redis ... done
Creating paintbynumbers-backend ... done
Creating paintbynumbers-celery ... done
Creating paintbynumbers-frontend ... done
```

**Wait 30-60 seconds for services to initialize**

---

### **STEP 5: Check All Services Running** [10 seconds]

```bash
docker-compose ps
```

**Expected Output:**
```
NAME                         COMMAND                  SERVICE      STATUS        PORTS
paintbynumbers-backend       "uvicorn app.main:ap…"   backend      Up            0.0.0.0:8000->8000/tcp
paintbynumbers-celery        "celery -A app.core.…"   celery       Up
paintbynumbers-db            "docker-entrypoint.s…"   db           Up (healthy)  0.0.0.0:5432->5432/tcp
paintbynumbers-frontend      "docker-entrypoint.s…"   frontend     Up            0.0.0.0:3000->3000/tcp
paintbynumbers-redis         "docker-entrypoint.s…"   redis        Up (healthy)  0.0.0.0:6379->6379/tcp
```

**All should show "Up" or "Up (healthy)"** ✅

**If any show "Exit" or "Restarting":**
```bash
# Check logs for that service
docker-compose logs [service-name]

# Example:
docker-compose logs backend
docker-compose logs frontend
```

---

### **STEP 6: Check Backend is Ready** [10 seconds]

```bash
curl http://localhost:8000/health

# Or in browser, go to: http://localhost:8000/health
```

**Expected Output:**
```json
{"status":"healthy","database":"connected","redis":"connected"}
```

**Or check API docs:**
```bash
# Open in browser: http://localhost:8000/docs
```

You should see Swagger API documentation ✅

---

### **STEP 7: Check Frontend is Ready** [10 seconds]

**Open browser and go to:**
```
http://localhost:3000
```

**Expected:** Homepage loads with "Paint by Numbers AI" ✅

---

### **STEP 8: Check Database** [10 seconds]

```bash
# Connect to database
docker-compose exec db psql -U paintuser -d paintbynumbers

# Inside database:
\dt  # List tables
\q   # Quit
```

**Expected:** You should see tables like `templates`, `users`, etc. ✅

---

## ✅ COMPLETE TESTING CHECKLIST

### **TEST 1: Homepage** [30 seconds]

**URL:** http://localhost:3000

**Check:**
- [ ] Page loads without errors
- [ ] Header shows "Paint by Numbers AI"
- [ ] See hero section
- [ ] See "Create Custom Template" button
- [ ] See navigation (Shop, Create, Gallery)

**Expected:** Everything displays correctly ✅

---

### **TEST 2: Shop Page** [1 minute]

**URL:** http://localhost:3000/shop

**Check:**
- [ ] Page loads
- [ ] See paint kit cards
- [ ] Each kit shows price, description
- [ ] "Add to Cart" buttons visible
- [ ] Cart icon in header shows (0)

**Test adding to cart:**
1. Click "Add to Cart" on any kit
2. Success message appears ✅
3. Cart count updates (0 → 1) ✅

---

### **TEST 3: Cart Page** [1 minute]

**URL:** http://localhost:3000/cart

**After adding items:**

**Check:**
- [ ] Items from shop appear in cart
- [ ] Correct prices shown
- [ ] Quantity controls (+ and -) work
- [ ] Remove button works
- [ ] Subtotal, tax, total calculated
- [ ] "Proceed to Checkout" button enabled

**Test:**
1. Increase quantity → total updates ✅
2. Decrease quantity → total updates ✅
3. Remove item → cart updates ✅

---

### **TEST 4: Checkout Page** [1 minute]

**URL:** http://localhost:3000/checkout

**Check:**
- [ ] Page loads (NO 404!) ✅
- [ ] Shows order summary on right
- [ ] Form fields for contact info
- [ ] Form fields for shipping address
- [ ] Payment section (test mode notice)
- [ ] "Complete Order" button

**Test form:**
1. Fill in email: test@test.com
2. Fill in name: Test User
3. Fill in address: 123 Test St
4. Fill in city, state, zip
5. Card: 4242 4242 4242 4242
6. Expiry: 12/26, CVC: 123
7. Click "Complete Order"

**Expected:**
- Processing... (2 seconds)
- Redirect to success page ✅

---

### **TEST 5: Success Page** [30 seconds]

**URL:** http://localhost:3000/checkout/success

**After completing checkout:**

**Check:**
- [ ] Green checkmark ✅
- [ ] "Order Confirmed!" message
- [ ] Order number displayed
- [ ] Order details shown
- [ ] Items list correct
- [ ] Total amount correct
- [ ] "Continue Shopping" button

**Verify:**
- Cart is cleared (empty)
- Order saved in localStorage

---

### **TEST 6: Create Page (IMAGE UPLOAD)** [2 minutes]

**URL:** http://localhost:3000/create

**Check:**
- [ ] Upload area visible
- [ ] "Drag & drop" instructions
- [ ] File size limit shown (10MB)
- [ ] Supported formats shown

**Test upload:**
1. Click upload area
2. Select an image (JPG or PNG)
3. Wait for validation

**Expected:**
- Image preview appears ✅
- Image info shows (dimensions, size) ✅
- AI recommendation appears ✅
- "Generate Template" button enabled ✅

---

### **TEST 7: Template Generation** [1 minute]

**After uploading image on Create page:**

**Steps:**
1. Choose model (or use recommended)
2. Choose palette (or use recommended)
3. Click "Generate Template"

**Expected:**
- Progress bar appears ✅
- Status messages update:
  - "Uploading image..."
  - "Analyzing colors..."
  - "Creating template..."
- Processing takes 30-45 seconds ✅
- Redirects to preview page ✅

**Check backend logs while processing:**
```bash
docker-compose logs -f backend
docker-compose logs -f celery
```

You should see processing logs ✅

---

### **TEST 8: Preview Page** [1 minute]

**After generation completes:**

**URL:** http://localhost:3000/preview/[template-id]

**Check:**
- [ ] Template image displays (numbered)
- [ ] Legend image displays (colors)
- [ ] Before/After slider works
- [ ] Template info shows:
  - Number of colors
  - Difficulty level
  - Estimated time
  - Quality score
- [ ] Download buttons visible:
  - Template PNG
  - Legend PNG
  - Solution PNG
  - PDF
  - SVG

**Test downloads:**
1. Click "Download Template"
2. File downloads ✅
3. Open file - should show numbered template ✅

---

### **TEST 9: API Health** [30 seconds]

**Check backend API:**

```bash
# Health check
curl http://localhost:8000/health

# List models
curl http://localhost:8000/api/v1/models

# List palettes
curl http://localhost:8000/api/v1/palettes
```

**Expected:** All return JSON responses ✅

---

### **TEST 10: Database Check** [30 seconds]

**Verify data is being saved:**

```bash
# Connect to database
docker-compose exec db psql -U paintuser -d paintbynumbers

# Check templates table
SELECT id, title, palette_name, num_colors, difficulty_level
FROM templates
ORDER BY created_at DESC
LIMIT 5;

# Exit
\q
```

**Expected:** See your generated templates in database ✅

---

## 🔍 VIEW LOGS (For Debugging)

### **View All Logs:**
```bash
docker-compose logs -f
```

### **View Specific Service:**
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Celery worker logs
docker-compose logs -f celery_worker

# Database logs
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100 backend
```

---

## 🐛 TROUBLESHOOTING

### **Problem 1: Port Already in Use**

**Error:**
```
Error starting userland proxy: listen tcp 0.0.0.0:3000: bind: address already in use
```

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :3000
sudo lsof -i :8000

# Kill the process
sudo kill -9 [PID]

# Or stop all containers and restart
docker-compose down
docker-compose up -d
```

---

### **Problem 2: Database Not Connecting**

**Error:** "Connection refused" in backend logs

**Solution:**
```bash
# Restart database
docker-compose restart db

# Wait 10 seconds
sleep 10

# Restart backend
docker-compose restart backend

# Check database is healthy
docker-compose ps db
```

---

### **Problem 3: Frontend Shows Error**

**Error:** 404 or connection error

**Solution:**
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend

# Check it's running
docker-compose ps frontend
```

---

### **Problem 4: Celery Worker Not Processing**

**Issue:** Template generation hangs

**Solution:**
```bash
# Check Celery logs
docker-compose logs celery_worker

# Restart Celery
docker-compose restart celery_worker

# Verify Redis is running
docker-compose ps redis
```

---

### **Problem 5: Permission Errors**

**Error:** Permission denied

**Solution:**
```bash
# Fix permissions on directories
sudo chown -R $USER:$USER /home/user/mine/webapp/backend/uploads
sudo chown -R $USER:$USER /home/user/mine/webapp/backend/output

# Or run with sudo (not recommended for production)
sudo docker-compose up -d
```

---

## 📊 VERIFICATION CHECKLIST

### **All Services Running:**
- [ ] Database (PostgreSQL) - Port 5432 ✅
- [ ] Redis - Port 6379 ✅
- [ ] Backend (FastAPI) - Port 8000 ✅
- [ ] Frontend (Next.js) - Port 3000 ✅
- [ ] Celery Worker ✅

### **All Pages Load:**
- [ ] Homepage (http://localhost:3000) ✅
- [ ] Shop (http://localhost:3000/shop) ✅
- [ ] Cart (http://localhost:3000/cart) ✅
- [ ] Checkout (http://localhost:3000/checkout) ✅
- [ ] Create (http://localhost:3000/create) ✅

### **All Features Work:**
- [ ] Add to cart ✅
- [ ] View cart ✅
- [ ] Checkout flow ✅
- [ ] Image upload ✅
- [ ] Template generation ✅
- [ ] Preview & download ✅

### **Backend Working:**
- [ ] API health check ✅
- [ ] Swagger docs ✅
- [ ] Database connected ✅
- [ ] Redis connected ✅

---

## 🎯 QUICK TEST SCRIPT

**Run all tests in 5 minutes:**

```bash
#!/bin/bash

echo "🚀 Testing Paint by Numbers AI..."

# 1. Start services
echo "1. Starting services..."
cd /home/user/mine/webapp
docker-compose up -d

# 2. Wait for services
echo "2. Waiting 30 seconds for services to start..."
sleep 30

# 3. Check services
echo "3. Checking services..."
docker-compose ps

# 4. Test backend
echo "4. Testing backend API..."
curl -s http://localhost:8000/health | jq

# 5. Test frontend
echo "5. Testing frontend..."
curl -I http://localhost:3000 | head -1

# 6. Test models endpoint
echo "6. Testing models endpoint..."
curl -s http://localhost:8000/api/v1/models | jq '.[0].name'

# 7. Test palettes endpoint
echo "7. Testing palettes endpoint..."
curl -s http://localhost:8000/api/v1/palettes | jq '.[0].name'

echo "✅ All basic tests passed!"
echo ""
echo "Now open browser:"
echo "  - Frontend: http://localhost:3000"
echo "  - API Docs: http://localhost:8000/docs"
```

Save this as `test.sh`, make executable, and run:
```bash
chmod +x test.sh
./test.sh
```

---

## 🌐 ACCESS URLS

Once everything is running:

| Service | URL | What It Does |
|---------|-----|--------------|
| **Frontend Homepage** | http://localhost:3000 | Main website |
| **Shop** | http://localhost:3000/shop | Browse paint kits |
| **Cart** | http://localhost:3000/cart | Shopping cart |
| **Checkout** | http://localhost:3000/checkout | Complete purchase |
| **Create** | http://localhost:3000/create | Upload & generate |
| **API Docs** | http://localhost:8000/docs | Swagger API documentation |
| **API Health** | http://localhost:8000/health | Backend health check |

---

## 🎯 SUCCESS CRITERIA

**Your app is working if:**

1. ✅ All 5 Docker containers running
2. ✅ Homepage loads at http://localhost:3000
3. ✅ Can add items to cart
4. ✅ Can view cart
5. ✅ Checkout page loads (no 404!)
6. ✅ Can upload image on Create page
7. ✅ Template generation works (30-45 sec)
8. ✅ Can view and download generated template
9. ✅ Backend API responds at http://localhost:8000
10. ✅ Database stores data

**If all 10 pass → YOUR APP IS READY! 🎉**

---

## 📞 NEXT STEPS AFTER TESTING

**If everything works:**
1. ✅ Celebrate! Your app is running
2. ⏳ Enable real Stripe payments
3. ⏳ Set pricing
4. ⏳ Launch!

**If something doesn't work:**
1. Check logs: `docker-compose logs [service]`
2. Restart problematic service: `docker-compose restart [service]`
3. Check this troubleshooting section
4. Share error message if you need help

---

## 🚀 START NOW

**Copy-paste these commands:**

```bash
# 1. Go to project
cd /home/user/mine/webapp

# 2. Start everything
docker-compose down
docker-compose up -d

# 3. Wait 30 seconds
sleep 30

# 4. Check status
docker-compose ps

# 5. Open browser
# Go to: http://localhost:3000
```

**That's it! You should see your app running!** 🎉

---

**Time to complete:** 2-3 minutes to start, 10-15 minutes to test everything

**READY? START NOW!** 🚀
