# SnippetStream

**Transform long-form content into engaging social media posts for X/Twitter, LinkedIn, and Instagram.**

SnippetStream is a modern web application that takes your long-form content (Markdown, text, or URLs) and repurposes it into platform-optimized social media posts using AI.

## 🚀 Features

- **User Authentication**: Secure Google OAuth login system
- **Subscription Management**: Free and Pro tiers with Dodo Payments integration
- **Content Generation**: AI-powered social media content creation
- **Template System**: Custom and community templates
- **Content Library**: Save, organize, and manage generated content
- **Profile Management**: User profiles with avatar upload
- **Real-time Updates**: Webhook-based payment processing
- **Modern UI**: Beautiful, responsive Next.js frontend with light/dark themes

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript
- **React Context** - State management for auth and preferences

### Backend
- **FastAPI** - High-performance Python web framework
- **PostgreSQL** - Production database with SQLAlchemy ORM
- **Dodo Payments** - Payment processing with webhook support
- **Google OAuth** - Secure authentication
- **JWT** - Token-based authentication

### Deployment
- **Vercel** - Backend API deployment (https://snippetstreamapi.vercel.app)
- **Vercel/Netlify** - Frontend deployment
- **GitHub** - Source code management

## 📋 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL database
- Google OAuth credentials
- Dodo Payments account

### Local Development

1. **Clone the repositories**
```bash
# Frontend
git clone https://github.com/yourusername/snippetstream-frontend.git
cd snippetstream-frontend

# Backend (separate repo)
git clone https://github.com/Mohitsharma1214/snippetstream-api.git
cd snippetstream-api
```

2. **Backend Setup**
```bash
cd snippetstream-api
pip install -r requirements.txt
cp .env.sample .env
# Edit .env with your credentials
python start-backend.py
```

3. **Frontend Setup**
```bash
cd snippetstream-frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with API URL
npm run dev
```

### Production Deployment

#### Backend (Vercel)
The backend is deployed at: **https://snippetstreamapi.vercel.app**

```bash
cd snippetstream-api
vercel --prod
```

#### Frontend
```bash
cd snippetstream-frontend
# Set NEXT_PUBLIC_API_URL=https://snippetstreamapi.vercel.app
npm run build
vercel --prod
```

## 🔗 API Endpoints

### Authentication
- `POST /api/v1/auth/google` - Google OAuth login
- `GET /api/v1/auth/me` - Get current user
- `GET /api/v1/auth/feature-limits` - Get user feature limits

### Content Generation
- `POST /api/v1/content/generate` - Generate social media content
- `GET /api/v1/content/history` - Get user's content history
- `POST /api/v1/content/save` - Save generated content

### Templates
- `GET /api/v1/templates/public` - Get public templates
- `POST /api/v1/templates/custom` - Create custom template
- `GET /api/v1/templates/custom` - Get user's custom templates

### Payments
- `POST /api/v1/payment/create-checkout` - Create payment checkout
- `POST /api/v1/payment/check-status` - Check payment status
- `POST /api/v1/payment/webhook` - Webhook endpoint for Dodo Payments

## 🔧 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost/snippetstream

# JWT Authentication
JWT_SECRET_KEY=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Dodo Payments
DODO_API_KEY=your-dodo-api-key
DODO_WEBHOOK_SECRET=your-webhook-secret

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://snippetstreamapi.vercel.app

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## 🎯 Use Cases

- **Content Creators**: Repurpose blog posts into social content
- **Marketers**: Transform newsletters into multi-platform campaigns  
- **Businesses**: Convert long-form content into social media strategies
- **Agencies**: Manage multiple client content transformations

## 🚀 Deployment Architecture

```
Frontend (Vercel/Netlify)
    ↓ HTTPS API calls
Backend API (Vercel)
    ↓ Database queries
PostgreSQL (Neon/Railway)
    ↓ Webhook notifications
Dodo Payments
```

## 📝 Project Structure

```
snippetstream-frontend/
├── app/
│   ├── auth/
│   ├── pricing/
│   ├── features/
│   └── page.tsx
├── components/
│   ├── AuthModal.tsx
│   ├── PaymentModal.tsx
│   ├── DashboardModal.tsx
│   └── ...
├── contexts/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
└── lib/

snippetstream-api/
├── routes/
│   ├── auth_routes.py
│   ├── payment_routes_new.py
│   └── content_routes.py
├── api/
│   └── index.py (Vercel entry point)
├── models.py
├── database.py
└── main.py
```

## 🔮 Recent Updates

- ✅ Deployed backend API to Vercel
- ✅ Implemented webhook-based payment processing
- ✅ Added comprehensive user authentication
- ✅ Created subscription management system
- ✅ Built content library and template system
- ✅ Added profile management with avatar upload
- ✅ Implemented light/dark theme support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Ready to transform your content? Start repurposing and watch your long-form content become social media gold! ✨**