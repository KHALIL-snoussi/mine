# Fix Docker Build Merge Conflict Error

## Problem

Docker build is showing merge conflicts in `app/create/page.tsx`:
```
Error: Merge conflict marker encountered.
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
```

## Root Cause

The Docker build is using **cached or stale files** that contain merge conflict markers. The actual source files in git are clean and correct.

## Solution

### Option 1: Rebuild Docker Without Cache (Recommended)

```bash
# Navigate to project root
cd /home/user/mine

# Rebuild Docker containers with no cache
docker-compose build --no-cache

# Or if using docker build directly:
docker build --no-cache -t paintbynumbers-frontend ./webapp/frontend
```

### Option 2: Clean Docker Build Context

```bash
# Remove any temporary files in build context
cd /home/user/mine/webapp/frontend
rm -rf node_modules .next out build

# Rebuild
cd /home/user/mine
docker-compose build
```

### Option 3: Force Git Clean State

```bash
# Ensure no stashed changes or conflicts
cd /home/user/mine
git stash clear
git clean -fd

# Rebuild
docker-compose build --no-cache
```

## Verification

After rebuilding, the build should succeed without merge conflict errors.

The source files are correct:
- ✅ No merge conflicts in git working tree
- ✅ No merge conflict markers in actual files
- ✅ All changes committed and pushed

## Quick Fix Command

```bash
cd /home/user/mine && \
git clean -fd && \
docker-compose build --no-cache frontend
```

This will:
1. Clean any untracked files
2. Rebuild Docker with no cache
3. Use the correct, clean source files
