#!/bin/bash

echo "======================================================================"
echo "🌐 STARTING PAINT BY NUMBERS WEB APP"
echo "======================================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo ""
    echo "The web app requires Docker to run. You have 2 options:"
    echo ""
    echo "OPTION 1: Install Docker (Recommended)"
    echo "========================================="
    echo "Run these commands:"
    echo ""
    echo "  # Install Docker"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    echo ""
    echo "  # Start Docker service"
    echo "  sudo systemctl start docker"
    echo ""
    echo "  # Then run this script again"
    echo "  ./start_web_app.sh"
    echo ""
    echo "OPTION 2: Use Python Scripts (No Docker Needed)"
    echo "================================================="
    echo "Use the command-line interface instead:"
    echo ""
    echo "  # Quick test"
    echo "  python3 generate_ultra_hd.py"
    echo ""
    echo "  # Your own image"
    echo "  python3 generate_my_image.py your_photo.jpg"
    echo ""
    echo "======================================================================"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "❌ docker-compose is not available"
    echo ""
    echo "Install it with:"
    echo "  sudo apt-get install docker-compose-plugin"
    echo ""
    exit 1
fi

echo "✅ docker-compose is available"
echo ""

# Go to webapp directory
cd "$(dirname "$0")/webapp" || exit 1

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
fi

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null
echo ""

# Start the services
echo "🚀 Starting web app services..."
echo "   This may take a few minutes on first run (downloading images)..."
echo ""

if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================================================"
    echo "✅ WEB APP STARTED SUCCESSFULLY!"
    echo "======================================================================"
    echo ""
    echo "Waiting 10 seconds for services to initialize..."
    sleep 10
    echo ""
    echo "🌐 Access your web app:"
    echo ""
    echo "   Frontend (Main Website):"
    echo "   → http://localhost:3000"
    echo ""
    echo "   Backend API Documentation:"
    echo "   → http://localhost:8000/api/docs"
    echo ""
    echo "   Backend Health Check:"
    echo "   → http://localhost:8000/health"
    echo ""
    echo "======================================================================"
    echo ""
    echo "📊 To check service status:"
    echo "   cd webapp && docker-compose ps"
    echo ""
    echo "📋 To view logs:"
    echo "   cd webapp && docker-compose logs -f"
    echo ""
    echo "🛑 To stop the web app:"
    echo "   cd webapp && docker-compose down"
    echo ""
    echo "======================================================================"
    echo ""
    echo "🎨 Now you can:"
    echo "   1. Open http://localhost:3000 in your browser"
    echo "   2. Go to 'Create' page"
    echo "   3. Upload your image"
    echo "   4. Select 'Ultra Detailed HD Pro' model"
    echo "   5. Generate your crystal-clear template!"
    echo ""
    echo "✨ The Ultra Detailed HD Pro model will automatically:"
    echo "   • Detect if your image needs upscaling"
    echo "   • Find and optimize faces"
    echo "   • Enhance to 4960x7016 pixels (A2 quality!)"
    echo "   • Generate with 30 colors for maximum detail"
    echo ""
else
    echo ""
    echo "======================================================================"
    echo "❌ FAILED TO START WEB APP"
    echo "======================================================================"
    echo ""
    echo "Please check the error messages above."
    echo ""
    echo "Common issues:"
    echo "   1. Port 3000 or 8000 already in use"
    echo "   2. Docker service not running (run: sudo systemctl start docker)"
    echo "   3. Permissions issue (try: sudo ./start_web_app.sh)"
    echo ""
    echo "Or use the Python scripts instead (no Docker needed):"
    echo "   python3 generate_ultra_hd.py"
    echo ""
    exit 1
fi
