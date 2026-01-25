# Reword

**Transform long-form content into engaging social media posts for X/Twitter, LinkedIn, and Instagram.**

Reword (formerly SnippetStream) is a modern web application that takes your long-form content (Markdown, text, or URLs) and repurposes it into platform-optimized social media posts using AI.

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

### Frontend (`/frontend`)
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript
- **React Context** - State management for auth and preferences

### Backend (`/backend`)
- **FastAPI** - High-performance Python web framework
- **PostgreSQL** - Production database with SQLAlchemy ORM
- **Dodo Payments** - Payment processing with webhook support
- **Google OAuth** - Secure authentication
- **JWT** - Token-based authentication

### Deployment
- **Backend**: Deployed on Railway (https://snippetstream-api22-production.up.railway.app)
- **Frontend**: Deployed on Vercel/Netlify
- **GitHub**: Source code management (Monorepo)

## 📋 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL database
- Google OAuth credentials
- Dodo Payments account

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/microsaasteam0/Reword.git
cd Reword
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
# Ensure .env is set in the root directory
python main.py
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
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

### Payments
- `POST /api/v1/payment/create-checkout` - Create payment checkout
- `POST /api/v1/payment/check-status` - Check payment status
- `POST /api/v1/payment/webhook` - Webhook endpoint for Dodo Payments

## 🔧 Environment Variables

The project uses a unified `.env` file in the root directory for both frontend and backend configuration.

```env
# BACKEND CONFIGURATION
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SECRET_KEY=...
BACKEND_URL=https://snippetstream-api22-production.up.railway.app/
FRONTEND_URL=http://localhost:3000

# FRONTEND CONFIGURATION
NEXT_PUBLIC_API_URL=https://snippetstream-api22-production.up.railway.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

## 🚀 Deployment Architecture

```
Frontend (Vercel/Netlify)
    ↓ HTTPS API calls
Backend API (Railway)
    ↓ Database queries
PostgreSQL (Neon)
    ↓ Webhook notifications
Dodo Payments
```

## 📝 Project Structure

```
Reword/
├── frontend/          # Next.js Application
│   ├── app/
│   ├── components/
│   ├── contexts/
│   └── ...
│
├── backend/           # FastAPI Application
│   ├── routes/
│   ├── api/
│   ├── models.py
│   ├── main.py
│   └── ...
│
├── .env               # Unified Configuration
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Ready to transform your content? Start repurposing with Reword! ✨**