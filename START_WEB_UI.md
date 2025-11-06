# 🌐 START WEB UI - ULTRA SIMPLE

Since you have Docker installed, just run these commands:

## 🚀 START THE WEB APP (Copy & Paste)

```bash
cd /home/user/mine/webapp
docker-compose down
docker-compose up -d
```

**Wait 30 seconds**, then:

## 🌐 OPEN IN BROWSER

```
http://localhost:3000
```

That's it! ✨

---

## 📋 COMPLETE STEP-BY-STEP

### Step 1: Go to webapp directory
```bash
cd /home/user/mine/webapp
```

### Step 2: Create .env file (first time only)
```bash
cp .env.example .env
```

### Step 3: Start all services
```bash
docker-compose up -d
```

This starts:
- ✅ Backend (FastAPI) on port 8000
- ✅ Frontend (Next.js) on port 3000
- ✅ Database (PostgreSQL)
- ✅ Redis cache
- ✅ Celery worker

### Step 4: Wait 30-60 seconds for services to start

```bash
# Check status
docker-compose ps
```

Should show all services "Up"

### Step 5: Open browser

**Main Website:**
```
http://localhost:3000
```

**API Docs:**
```
http://localhost:8000/api/docs
```

---

## 🎨 USE THE ULTRA DETAILED HD PRO MODEL

1. **Go to:** `http://localhost:3000/create`

2. **Upload your image** (any size - even 640x480!)

3. **Select model:** "Ultra Detailed HD Pro" 💎

4. **Select format:** A4, A3, or A2

5. **Click "Generate Template"**

6. **Wait 60-180 seconds**

7. **Download your crystal-clear template!**

### What Happens Automatically:
- ✅ Image analyzed
- ✅ Face detection (if portrait)
- ✅ Auto-upscaling (if small image)
- ✅ Face-optimized processing
- ✅ 30 colors, A2 quality
- ✅ Crystal-clear result!

---

## 📊 CHECK STATUS

```bash
# View all services
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🛑 STOP WEB APP

```bash
cd /home/user/mine/webapp
docker-compose down
```

---

## 🔧 TROUBLESHOOTING

### Problem: Port already in use

```bash
# Stop any existing containers
docker-compose down

# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :8000

# Start again
docker-compose up -d
```

### Problem: Services not starting

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild containers
docker-compose up -d --build
```

### Problem: Frontend shows errors

```bash
# Restart frontend
docker-compose restart frontend

# Wait 30 seconds
sleep 30

# Open browser again
```

---

## ✅ QUICK START (ONE COMMAND)

```bash
cd /home/user/mine/webapp && docker-compose down && docker-compose up -d && sleep 30 && echo "✅ Ready! Open http://localhost:3000"
```

Copy that entire line, paste in terminal, press Enter!

---

## 🎯 THAT'S IT!

1. **Start:** `cd /home/user/mine/webapp && docker-compose up -d`
2. **Wait:** 30 seconds
3. **Open:** http://localhost:3000
4. **Use Ultra Detailed HD Pro model** 💎
5. **Get crystal-clear results!** ✨

**Your faces will be PERFECT!** 🎨
