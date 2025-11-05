# 🎨 Paint by Numbers AI - Web Platform

A complete full-stack web application for creating professional paint-by-numbers templates using AI-powered intelligent features.

## 🌟 Features

### Core Functionality
- **AI-Powered Template Generation** - Upload any image and instantly create paint-by-numbers templates
- **Intelligent Palette Selection** - Automatic theme detection and optimal color palette recommendation
- **Unified Color Palettes** - 7 professional palettes; one paint set works for all templates
- **Difficulty Analysis** - Automatic rating from Easy to Expert with estimated completion times
- **Quality Scoring** - 6 comprehensive metrics evaluating template quality
- **Color Optimization** - Perceptual color matching using LAB color space
- **Color Mixing Guides** - Professional mixing recipes from base paints

### Download Formats
- PNG (Template, Legend, Solution, Guide)
- SVG (Scalable vector graphics)
- PDF (Complete kit with all materials)

### User Features
- User authentication and authorization
- Template gallery (public and private)
- Dashboard with template management
- Usage tracking and limits
- Multiple subscription tiers

### Business Model
- **Free**: 3 templates/month, PNG downloads
- **Basic**: $9.99/month, 25 templates, all formats, AI analysis
- **Pro**: $19.99/month, unlimited templates, custom palettes, commercial license

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Shadcn/ui
- **Animation**: Framer Motion
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Forms**: React Hook Form
- **File Upload**: react-dropzone

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache**: Redis
- **Background Jobs**: Celery
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Bcrypt (passlib)
- **Image Processing**: OpenCV, NumPy, scikit-image
- **Vector Graphics**: svgwrite
- **PDF Generation**: reportlab
- **Payment Processing**: Stripe
- **File Storage**: AWS S3 (or local filesystem)

### DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (reverse proxy & load balancing)
- **Deployment**: Docker-based multi-container architecture

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd webapp
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start the Application
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 5. Create Database Tables
```bash
# Run migrations (first time only)
docker-compose exec backend alembic upgrade head
```

## 📁 Project Structure

```
webapp/
├── frontend/                 # Next.js frontend
│   ├── app/                 # Next.js app directory
│   │   ├── page.tsx        # Landing page
│   │   ├── create/         # Upload & create page
│   │   ├── dashboard/      # User dashboard
│   │   ├── templates/      # Template detail pages
│   │   ├── login/          # Login page
│   │   └── signup/         # Signup page
│   ├── components/          # React components
│   │   └── ui/             # UI components
│   ├── lib/                 # Utilities
│   │   ├── api.ts          # API client
│   │   ├── hooks.ts        # React Query hooks
│   │   └── utils.ts        # Helper functions
│   └── Dockerfile
│
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py      # Authentication
│   │   │       │   ├── users.py     # User management
│   │   │       │   └── templates.py # Template CRUD
│   │   │       └── router.py
│   │   ├── core/           # Core functionality
│   │   │   ├── config.py   # Settings
│   │   │   └── database.py # Database setup
│   │   ├── models/         # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   └── template.py
│   │   └── schemas/        # Pydantic schemas
│   │       ├── user.py
│   │       └── template.py
│   ├── main.py             # FastAPI app entry
│   ├── requirements.txt
│   └── Dockerfile
│
├── nginx/                   # Nginx configuration
│   └── nginx.conf
│
├── docker-compose.yml       # Multi-container orchestration
└── README.md
```

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Database Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token

### Users
- `GET /api/v1/users/me` - Get current user info
- `PUT /api/v1/users/me` - Update current user
- `GET /api/v1/users/usage` - Get usage statistics

### Templates
- `POST /api/v1/templates/generate` - Generate new template
- `GET /api/v1/templates/` - List templates
- `GET /api/v1/templates/{id}` - Get template details
- `DELETE /api/v1/templates/{id}` - Delete template
- `GET /api/v1/templates/palettes/list` - List available palettes
- `GET /api/v1/templates/presets/list` - List difficulty presets

## 🎯 Key Features Explained

### Intelligent Palette Selection
The system analyzes uploaded images for:
- **Theme Detection**: nature, warm_sunset, vibrant, pastel, earth, dark, sky_water
- **Dominant Colors**: Identifies primary hues
- **Saturation Levels**: Vibrant vs muted
- **Color Temperature**: Warm vs cool tones

Based on this analysis, it recommends the most suitable palette from 7 professional options.

### Unified Color System
All templates use predefined color palettes (not extracted from images). This means:
- ✅ One paint set works for all templates
- ✅ Consistent color quality
- ✅ Enables selling custom paint sets
- ✅ Better mixing guides

### Difficulty Analysis
Templates are rated 0-100 based on:
- Number of regions
- Small region complexity
- Color count and similarity
- Region density
- Estimated completion time (1-20+ hours)

### Quality Scoring
Six metrics evaluate template quality:
1. Color accuracy (PSNR)
2. Region quality (size distribution)
3. Number visibility
4. Color distribution balance
5. Edge clarity
6. Paintability

## 💳 Payment Integration

The platform integrates with Stripe for subscription management:

1. **Subscription Plans**:
   - Free: 3 templates/month
   - Basic: $9.99/month - 25 templates
   - Pro: $19.99/month - Unlimited

2. **Webhook Handling**: Automatic subscription status updates

3. **Usage Tracking**: Monthly limits enforced per user role

## 🗄️ Database Schema

### Users Table
- Authentication (email, password)
- Role (FREE, BASIC, PRO, ADMIN)
- Subscription info (Stripe customer ID, status)
- Usage tracking

### Templates Table
- User relationship
- Generation settings (palette, colors)
- File URLs (all formats)
- Analysis data (JSON)
- Stats (views, likes, downloads)
- Public/featured flags

## 🔒 Security

- JWT-based authentication
- Bcrypt password hashing
- CORS configuration
- Rate limiting (Nginx)
- SQL injection protection (SQLAlchemy ORM)
- XSS protection (React escaping)
- File upload validation

## 📊 Monitoring & Logging

- Application logs via Python logging
- Nginx access/error logs
- Health check endpoints
- Docker container logs

## 🚢 Production Deployment

### 1. Set Production Environment Variables
```bash
# Generate secure secret key
SECRET_KEY=$(openssl rand -hex 32)

# Configure AWS S3 for file storage
USE_S3=true

# Set up Stripe for payments
STRIPE_API_KEY=sk_live_...
```

### 2. Configure SSL/TLS
- Obtain SSL certificates (Let's Encrypt recommended)
- Update nginx.conf with SSL configuration
- Enable HTTPS redirect

### 3. Deploy with Docker
```bash
docker-compose --profile production up -d
```

### 4. Set Up Database Backups
```bash
# Example backup script
docker-compose exec db pg_dump -U paintuser paintbynumbers > backup.sql
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@paintbynumbers.com

## 🎉 Acknowledgments

- Built on the paint-by-numbers generator core engine
- Uses professional color palettes from art theory
- Intelligence features powered by computer vision algorithms
