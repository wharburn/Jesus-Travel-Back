# 🚗 JT Chauffeur Services - Backend System

> AI-powered booking and dispatch system for luxury chauffeur services

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-red.svg)](https://upstash.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Overview

An intelligent booking system that combines AI-powered customer interactions with efficient driver management. Built for JT Chauffeur Services to automate bookings, streamline operations, and provide exceptional customer experience.

### ✨ Key Features

- 🤖 **AI-Powered Conversations** - Natural language booking via WhatsApp
- 🎤 **Voice Support** - Voice-to-text and text-to-voice capabilities
- 📱 **WhatsApp Integration** - Customer and driver communications
- 🚗 **Smart Driver Dispatch** - Automated assignment based on availability
- 💰 **Manual Pricing Control** - Team-based quote approval workflow
- 📊 **Admin Dashboard** - Comprehensive management interface
- 🔌 **Uber Integration** - Optional fallback for overflow bookings
- 🔒 **Enterprise Security** - JWT auth, rate limiting, data encryption

---

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  WhatsApp   │────▶│  Green API   │────▶│   Backend   │
│  Customer   │     │   Gateway    │     │   Express   │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                 │
┌─────────────┐     ┌──────────────┐            │
│  OpenRouter │◀────│  AI Service  │◀───────────┤
│   Claude    │     │   Layer      │            │
└─────────────┘     └──────────────┘            │
                                                 │
┌─────────────┐     ┌──────────────┐            │
│   Upstash   │◀────│    Redis     │◀───────────┤
│   Redis     │     │   Database   │            │
└─────────────┘     └──────────────┘            │
                                                 │
┌─────────────┐     ┌──────────────┐            │
│    Admin    │────▶│  Dashboard   │◀───────────┘
│   Portal    │     │     API      │
└─────────────┘     └──────────────┘
```

---

## 🚀 Quick Start

### ⚡ **NEW: Phase 1 Complete!**

The backend foundation is built and ready to use! See **[START_HERE.md](./START_HERE.md)** for what's been implemented.

### Prerequisites
- Node.js 18+
- npm 9+
- Upstash Redis account
- Green API WhatsApp instance
- OpenRouter API key

### Installation

```bash
# Navigate to backend directory
cd backend

# Dependencies already installed!
# Just configure your API keys in .env

# Test database connection
npm run test:db

# Start development server
npm run dev
```

Server runs at `http://localhost:3000`

**📚 See [START_HERE.md](./START_HERE.md) for complete setup guide and what's working!**

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   │   ├── ai/          # OpenRouter integration
│   │   ├── whatsapp/    # Green API integration
│   │   ├── voice/       # Deepgram & ElevenLabs
│   │   ├── drivers/     # Driver management
│   │   ├── bookings/    # Booking logic
│   │   └── uber/        # Uber API (optional)
│   ├── utils/           # Helper functions
│   └── app.js           # Express app setup
├── tests/               # Test files
├── logs/                # Application logs
├── uploads/             # File uploads
├── docs/                # Documentation
├── .env.example         # Environment template
├── package.json         # Dependencies
└── server.js            # Entry point
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# AI Services
OPENROUTER_API_KEY=sk-or-v1-...
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...

# WhatsApp
GREEN_API_INSTANCE_ID=...
GREEN_API_TOKEN=...

# Business
BUSINESS_NAME=JT Chauffeur Services
BUSINESS_PHONE=+447700900000
```

**See [.env.example](./.env.example) for complete list**

---

## 📡 API Endpoints

### Public Endpoints
- `POST /api/v1/enquiries` - Create booking enquiry
- `GET /api/v1/bookings/:id` - Get booking details
- `POST /api/v1/webhook/whatsapp` - WhatsApp webhook

### Admin Endpoints (Auth Required)
- `GET /api/v1/enquiries` - List all enquiries
- `PUT /api/v1/enquiries/:id/quote` - Submit quote
- `GET /api/v1/bookings` - List all bookings
- `POST /api/v1/drivers` - Register driver
- `GET /api/v1/analytics/revenue` - Revenue stats

**📚 Full API documentation: [API_SPECIFICATION.md](./API_SPECIFICATION.md)**

---

## 🤖 AI Assistant

The AI assistant handles customer conversations using OpenRouter (Claude 3.5 Sonnet):

### Capabilities
- Extract booking details from natural language
- Handle multi-turn conversations
- Support voice messages
- Multi-language support
- Context-aware responses

### Example Conversation
```
Customer: "I need a ride from Heathrow to London tomorrow at 2pm"
AI: "I'd be happy to help! How many passengers will be traveling?"
Customer: "2 passengers with luggage"
AI: "Perfect! I recommend our Luxury Sedan or SUV. Which would you prefer?"
Customer: "Luxury sedan"
AI: "Great choice! I'm creating your booking request..."
```

---

## 🚗 Driver Management

### Driver Interface (WhatsApp)
Drivers interact via WhatsApp commands:

```
ONLINE          - Go available
OFFLINE         - Stop receiving jobs
JOBS            - View assignments
ACCEPT [REF]    - Accept booking
DECLINE [REF]   - Decline booking
ARRIVED         - Mark arrived at pickup
STARTED         - Begin journey
COMPLETED [REF] - Complete journey
```

### Automatic Assignment
System automatically assigns bookings based on:
- Driver availability
- Vehicle type match
- Location proximity
- Driver rating
- Current workload

---

## 📊 Admin Dashboard

Web-based dashboard for managing operations:

### Features
- **Enquiries**: Review and approve quotes
- **Bookings**: Track all reservations
- **Drivers**: Manage fleet and availability
- **Analytics**: Revenue and performance metrics
- **Settings**: Configure system parameters

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- enquiries.test.js
```

---

## 🚀 Deployment

### Render Deployment

```bash
# Install Render CLI
npm install -g render

# Login
render login

# Deploy
render deploy
```

**📚 Detailed deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)**

---

## 📈 Monitoring

- **Logs**: Winston logger → `logs/` directory
- **Errors**: Sentry integration
- **Uptime**: UptimeRobot monitoring
- **Performance**: New Relic APM

---

## 🔒 Security

- JWT authentication for admin endpoints
- Rate limiting (100 req/15min)
- Input validation and sanitization
- HTTPS/TLS encryption
- CORS configuration
- Helmet.js security headers

---

## 📚 Documentation

- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - System architecture
- [QUICK_START.md](./QUICK_START.md) - Setup guide
- [API_SPECIFICATION.md](./API_SPECIFICATION.md) - API reference
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Development plan

---

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Write tests
4. Submit pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🆘 Support

- **Documentation**: Check `/backend/docs`
- **Issues**: GitHub Issues
- **Email**: dev@jtchauffeur.com

---

**Built with ❤️ for JT Chauffeur Services**

