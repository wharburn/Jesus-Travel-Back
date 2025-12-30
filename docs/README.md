# JT Chauffeur Services

Professional chauffeur and security services website with AI-powered backend.

## 🚀 Project Structure

```
website_JT/
├── backend/          # Node.js API server
│   ├── src/         # Source code
│   ├── scripts/     # Utility scripts
│   └── docs/        # Documentation
├── images/          # Website images
├── favicon/         # Favicon files
├── *.html           # Frontend pages
├── *.js             # Frontend scripts
└── translations.js  # Multi-language support
```

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Upstash Redis** for caching
- **Upstash Vector** for AI embeddings
- **Upstash Search** for semantic search
- **OpenRouter AI** for intelligent responses
- **WhatsApp Business API** integration

### Frontend
- HTML5, CSS3, JavaScript
- Multi-language support (EN, ES, FR, DE, IT, PT)
- Responsive design
- Booking system integration

## 📦 Deployment

### Backend (Render.com)
1. Connect this GitHub repository to Render
2. Create a new Web Service
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables (see backend/.env.example)

### Frontend (Bluehost)
1. Upload all HTML, CSS, JS files
2. Upload images/ and favicon/ folders
3. Update API endpoint in booking.js to point to Render URL

## 🔧 Environment Variables

See `backend/.env.example` for required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL` - Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `UPSTASH_VECTOR_REST_URL` - Vector DB URL
- `UPSTASH_VECTOR_REST_TOKEN` - Vector DB token
- `UPSTASH_SEARCH_REST_URL` - Search URL
- `UPSTASH_SEARCH_REST_TOKEN` - Search token
- `JWT_SECRET` - JWT signing secret
- `OPENROUTER_API_KEY` - AI API key

## 📚 Documentation

- [Backend Documentation](backend/README.md)
- [API Specification](backend/API_SPECIFICATION.md)
- [Search Integration](backend/docs/SEARCH_INTEGRATION.md)
- [Getting Started](backend/GETTING_STARTED.md)

## 🧪 Testing

```bash
cd backend
npm install
npm run test:search    # Test search integration
npm run test:db        # Test database connection
npm run dev            # Start development server
```

## 📞 Contact

JT Chauffeur Services
- Website: [Your website URL]
- Email: [Your email]
- Phone: [Your phone]

## 📄 License

Private - All rights reserved

