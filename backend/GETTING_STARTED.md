# 🚀 Getting Started - JT Chauffeur Services Backend

## What's Been Built So Far

### ✅ Phase 1: Foundation (COMPLETE)

The following components have been implemented:

#### **Core Infrastructure**
- ✅ Express.js server with security middleware (Helmet, CORS)
- ✅ Winston logger for application logging
- ✅ Error handling middleware
- ✅ Request validation middleware
- ✅ JWT authentication middleware
- ✅ Rate limiting

#### **Database**
- ✅ Upstash Redis client configuration
- ✅ Upstash Vector client configuration
- ✅ Health check endpoints

#### **Data Models**
- ✅ Enquiry model with full CRUD operations
- ✅ Reference number generation system

#### **API Endpoints**
- ✅ `/api/v1/health` - Health check
- ✅ `/api/v1/auth/login` - Admin authentication
- ✅ `/api/v1/enquiries` - Create and manage enquiries
- ✅ `/api/v1/enquiries/:id/quote` - Submit quotes
- ✅ `/api/v1/enquiries/:id/accept` - Accept quotes
- ✅ `/api/v1/enquiries/:id/reject` - Reject quotes
- ✅ `/api/v1/webhooks/whatsapp` - WhatsApp webhook handler

#### **Services**
- ✅ WhatsApp client (Green API integration)
- ✅ WhatsApp message handler
- ✅ OpenRouter AI integration for conversations
- ✅ Booking information extraction

#### **Utilities**
- ✅ Helper functions (validation, formatting, etc.)
- ✅ Reference number generator
- ✅ Success/error response formatters

---

## 📦 Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```bash
# Required for basic functionality
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Required for AI features
OPENROUTER_API_KEY=sk-or-v1-your-key

# Required for WhatsApp
GREEN_API_INSTANCE_ID=your-instance-id
GREEN_API_TOKEN=your-token

# Admin credentials
ADMIN_EMAIL=admin@jtchauffeur.com
ADMIN_PASSWORD=ChangeThisPassword123!
JWT_SECRET=your-super-secret-jwt-key
```

### 3. Test Database Connection

```bash
npm run test:db
```

You should see:
```
✅ Redis PING: PONG
✅ Redis SET/GET: Hello from JT Chauffeur!
✅ Redis connection successful!
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

---

## 🧪 Testing the API

### 1. Health Check

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-29T...",
  "uptime": 123.456,
  "services": {
    "redis": "connected",
    "vector": "connected"
  }
}
```

### 2. Admin Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jtchauffeur.com",
    "password": "ChangeThisPassword123!"
  }'
```

Save the token from the response!

### 3. Create Enquiry

```bash
curl -X POST http://localhost:3000/api/v1/enquiries \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Smith",
    "customerPhone": "+447700123456",
    "customerEmail": "john@example.com",
    "pickupLocation": "Heathrow Terminal 5",
    "dropoffLocation": "Park Lane Hotel, London",
    "pickupDate": "2025-01-15",
    "pickupTime": "14:00",
    "passengers": 2,
    "vehicleType": "Luxury Sedan",
    "specialRequests": "Child seat required"
  }'
```

### 4. Get All Enquiries (Admin)

```bash
curl http://localhost:3000/api/v1/enquiries \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Submit Quote (Admin)

```bash
curl -X PUT http://localhost:3000/api/v1/enquiries/ENQUIRY_ID/quote \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 120.00,
    "currency": "GBP",
    "notes": "Price includes meet and greet service"
  }'
```

---

## 📱 WhatsApp Integration

### Setup Webhook

1. Get your server URL (use ngrok for local testing):
```bash
ngrok http 3000
```

2. Configure webhook in Green API dashboard:
```
Webhook URL: https://your-ngrok-url.ngrok.io/api/v1/webhooks/whatsapp
```

3. Send a test message to your WhatsApp business number:
```
"I need a ride from Heathrow to London tomorrow at 2pm"
```

The AI will respond and guide you through the booking process!

---

## 🔍 What's Next?

### Phase 2: Remaining Features

The following features are planned but not yet implemented:

#### **To Be Built:**
- [ ] Booking model and controller
- [ ] Driver model and management
- [ ] Vehicle model and management
- [ ] Automatic driver assignment algorithm
- [ ] Driver WhatsApp bot commands
- [ ] Analytics endpoints
- [ ] Voice message support (Deepgram + ElevenLabs)
- [ ] Uber API integration
- [ ] Admin dashboard frontend
- [ ] Comprehensive testing

#### **Current Limitations:**
- Quote acceptance creates enquiry status change but doesn't create booking yet
- No driver management system yet
- No automatic driver assignment
- Voice messages not supported yet
- Analytics not implemented

---

## 📂 Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app setup
│   ├── config/
│   │   ├── redis.js          # Redis client
│   │   └── vector.js         # Vector DB client
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── enquiryController.js
│   │   ├── healthController.js
│   │   └── webhookController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── models/
│   │   └── Enquiry.js        # Enquiry data model
│   ├── routes/
│   │   ├── index.js          # Route aggregator
│   │   ├── auth.js
│   │   ├── enquiries.js
│   │   ├── bookings.js       # Placeholder
│   │   ├── drivers.js        # Placeholder
│   │   ├── vehicles.js       # Placeholder
│   │   ├── analytics.js      # Placeholder
│   │   └── webhooks.js
│   ├── services/
│   │   ├── ai/
│   │   │   └── openrouter.js # AI conversation
│   │   └── whatsapp/
│   │       ├── client.js     # Green API client
│   │       └── messageHandler.js
│   └── utils/
│       ├── helpers.js        # Utility functions
│       └── logger.js         # Winston logger
├── scripts/
│   └── test-db.js           # Database test script
├── server.js                # Entry point
├── package.json
└── .env.example
```

---

## 🐛 Troubleshooting

### Server won't start
- Check all required environment variables are set
- Ensure Redis credentials are correct
- Check port 3000 is not already in use

### Redis connection fails
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Check Upstash dashboard - database should be active
- Test with `npm run test:db`

### WhatsApp messages not received
- Verify Green API instance is active and QR code scanned
- Check webhook URL is configured correctly
- Use ngrok for local testing
- Check logs for webhook errors

### AI not responding
- Verify `OPENROUTER_API_KEY` is valid
- Check you have credits in OpenRouter account
- Review logs for API errors

---

## 📚 Documentation

- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Complete system overview
- [API_SPECIFICATION.md](./API_SPECIFICATION.md) - Full API documentation
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Development plan
- [QUICK_START.md](./QUICK_START.md) - Detailed setup guide

---

## 🎉 You're Ready!

The foundation is built and working! You can now:
1. Create enquiries via API or WhatsApp
2. Have AI conversations with customers
3. Submit quotes as admin
4. Accept/reject quotes

Continue building the remaining features following the IMPLEMENTATION_ROADMAP.md!

