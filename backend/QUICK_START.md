# 🚀 Quick Start Guide - JT Chauffeur Services

## Prerequisites

Before you begin, ensure you have:
- **Node.js** 18+ installed ([Download](https://nodejs.org/))
- **npm** 9+ (comes with Node.js)
- **Git** installed
- Code editor (VS Code recommended)

---

## 📦 Required API Keys & Services

### 1. **Upstash Redis** (Database)
1. Go to [upstash.com](https://upstash.com/)
2. Sign up for free account
3. Create new Redis database
4. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### 2. **Upstash Vector** (AI Embeddings)
1. In Upstash dashboard, create Vector database
2. Choose dimension: 1536 (OpenAI embeddings)
3. Copy `UPSTASH_VECTOR_REST_URL` and `UPSTASH_VECTOR_REST_TOKEN`

### 3. **OpenRouter** (AI Conversations)
1. Go to [openrouter.ai](https://openrouter.ai/)
2. Sign up and add credits ($5 minimum)
3. Generate API key
4. Copy `OPENROUTER_API_KEY`

### 4. **Green API** (WhatsApp)
1. Go to [green-api.com](https://green-api.com/)
2. Sign up for account
3. Create WhatsApp instance
4. Scan QR code with WhatsApp
5. Copy `GREEN_API_INSTANCE_ID` and `GREEN_API_TOKEN`

### 5. **Deepgram** (Voice to Text)
1. Go to [deepgram.com](https://deepgram.com/)
2. Sign up for free account ($200 credit)
3. Generate API key
4. Copy `DEEPGRAM_API_KEY`

### 6. **ElevenLabs** (Text to Voice)
1. Go to [elevenlabs.io](https://elevenlabs.io/)
2. Sign up for free account
3. Generate API key
4. Choose voice and copy `ELEVENLABS_VOICE_ID`
5. Copy `ELEVENLABS_API_KEY`

### 7. **Uber API** (Optional)
1. Go to [developer.uber.com](https://developer.uber.com/)
2. Register application
3. Get credentials
4. Copy `UBER_CLIENT_ID`, `UBER_CLIENT_SECRET`, `UBER_SERVER_TOKEN`

---

## 🛠️ Installation Steps

### Step 1: Clone Repository
```bash
cd /Users/wph/Documents/Slonic\ Drive/website_JT
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your API keys
nano .env
```

Fill in all the API keys you obtained above.

### Step 4: Test Database Connection
```bash
npm run test:db
```

### Step 5: Start Development Server
```bash
npm run dev
```

Server should start at `http://localhost:3000`

---

## ✅ Verify Installation

### 1. Check Health Endpoint
```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "services": {
    "redis": "connected",
    "vector": "connected"
  }
}
```

### 2. Test WhatsApp Integration
Send a message to your Green API WhatsApp number:
```
"Hello"
```

You should receive an automated response.

### 3. Test AI Assistant
Send a booking request:
```
"I need a ride from Heathrow to London tomorrow at 2pm"
```

AI should respond asking for more details.

---

## 📱 Admin Dashboard Setup

### Step 1: Create Admin User
```bash
npm run create-admin
```

Follow prompts to create admin account.

### Step 2: Access Dashboard
Open browser: `http://localhost:3000/admin`

Login with credentials you just created.

---

## 🚗 Add Your First Driver

### Via Admin Dashboard:
1. Login to admin dashboard
2. Go to "Drivers" tab
3. Click "Add Driver"
4. Fill in driver details
5. Save

### Via API:
```bash
curl -X POST http://localhost:3000/api/v1/drivers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "James Wilson",
    "phone": "+447700888999",
    "email": "james@example.com",
    "licenseNumber": "WILSO123456AB7CD"
  }'
```

---

## 🎯 Test Complete Booking Flow

### 1. Customer Creates Enquiry (WhatsApp)
Send to your WhatsApp business number:
```
"Book a ride from Heathrow Terminal 5 to Park Lane Hotel tomorrow at 2pm for 2 passengers"
```

### 2. Pricing Team Receives Notification
Check pricing team WhatsApp for notification.

### 3. Submit Quote (Admin Dashboard)
1. Go to "Enquiries" tab
2. Find the enquiry
3. Click "Submit Quote"
4. Enter price: £120
5. Submit

### 4. Customer Receives Quote
Customer gets WhatsApp message with quote.

### 5. Customer Accepts
Customer replies: `"YES"`

### 6. Driver Gets Assignment
Driver receives WhatsApp notification.

### 7. Driver Accepts
Driver replies: `"ACCEPT JT-2025-001234"`

### 8. Customer Gets Confirmation
Customer receives driver details.

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to Redis"
**Solution:**
- Check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env`
- Verify Upstash Redis database is active
- Check internet connection

### Issue: "WhatsApp messages not received"
**Solution:**
- Verify Green API instance is active
- Check QR code is scanned
- Ensure webhook URL is configured in Green API dashboard
- Check `GREEN_API_INSTANCE_ID` and `GREEN_API_TOKEN`

### Issue: "AI not responding"
**Solution:**
- Check `OPENROUTER_API_KEY` is valid
- Verify you have credits in OpenRouter account
- Check API logs for errors

### Issue: "Voice messages not working"
**Solution:**
- Verify `DEEPGRAM_API_KEY` and `ELEVENLABS_API_KEY`
- Check you have credits in both accounts
- Test with text messages first

---

## 📚 Next Steps

1. **Read Documentation**
   - [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - System architecture
   - [API_SPECIFICATION.md](./API_SPECIFICATION.md) - API endpoints
   - [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Development plan

2. **Customize AI Assistant**
   - Edit conversation prompts in `src/services/ai/prompts.js`
   - Adjust response templates in `src/services/whatsapp/templates.js`

3. **Configure Business Settings**
   - Update business name, phone, email in `.env`
   - Customize pricing rules
   - Set up driver availability schedules

4. **Deploy to Production**
   - Follow deployment guide in `DEPLOYMENT.md`
   - Set up monitoring and alerts
   - Configure backups

---

## 🆘 Getting Help

- **Documentation**: Check `/backend` folder for detailed docs
- **Logs**: Check `logs/` folder for error logs
- **Support**: Contact development team

---

## 🎉 You're Ready!

Your JT Chauffeur Services booking system is now running!

**Test the system thoroughly before going live with real customers.**

---

**Happy Coding! 🚗💨**

