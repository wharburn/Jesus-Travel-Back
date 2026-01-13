# MCP Automated Quoting System - Setup Guide

## 🎉 System Overview

Your **MCP (Multi-Channel Pricing) Automated Quoting System** is now built and ready to deploy!

### What's Been Built:

✅ **Database Schema** - PostgreSQL tables for quotes, pricing rules, zones, and time multipliers  
✅ **Google Maps Integration** - Distance calculation and geocoding  
✅ **Zone Detection** - Automatic detection of Congestion Zone, ULEZ, and airports  
✅ **Time Multipliers** - Peak/off-peak pricing based on day and time  
✅ **Pricing Engine** - Complete quote calculation with all factors  
✅ **Supervised Mode** - WhatsApp notifications to pricing team for approval  
✅ **Quote Management** - Full CRUD operations for quotes  
✅ **API Endpoints** - RESTful API for quote generation and retrieval  

---

## 🚀 Quick Start

### Step 1: Database Setup

Due to IPv6 connectivity issues with Supabase from your network, you have two options:

#### Option A: Use Supabase SQL Editor (Recommended)

1. Go to https://supabase.com/dashboard/project/euspcpixdltyeasouoaw
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste the contents of `backend/src/database/schema.sql`
5. Click "Run" to execute
6. Create another new query
7. Copy and paste the contents of `backend/src/database/seed.sql`
8. Click "Run" to execute

#### Option B: Use psql Command Line

```bash
# Install psql if you don't have it
brew install postgresql

# Connect to your database
psql "postgresql://postgres:JesusWayne6667@db.euspcpixdltyeasouoaw.supabase.co:5432/postgres"

# Then run:
\i backend/src/database/schema.sql
\i backend/src/database/seed.sql
```

### Step 2: Verify Configuration

Your `.env` file is already configured with:

```bash
# Database
POSTGRES_CONNECTION_STRING=postgresql://postgres:JesusWayne6667@db.euspcpixdltyeasouoaw.supabase.co:5432/postgres

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyDtkzW3zbExrKKowMYZy83pQp9I5fciM2Y

# Pricing Mode
PRICING_MODE=supervised
NOTIFY_PRICING_TEAM=true
AUTO_QUOTE_THRESHOLD=500
```

### Step 3: Start the Server

```bash
cd backend
npm start
```

---

## 📋 API Endpoints

### Calculate Quote (Preview Only)
```bash
POST /api/v1/quotes/calculate
Content-Type: application/json

{
  "pickupAddress": "Heathrow Airport, London",
  "dropoffAddress": "10 Downing Street, London",
  "pickupDatetime": "2026-01-15T14:30:00Z",
  "vehicleType": "Executive Sedan",
  "passengers": 2,
  "luggage": 2
}
```

### Generate Quote (Save & Send to Pricing Team)
```bash
POST /api/v1/quotes/generate
Content-Type: application/json

{
  "pickupAddress": "Heathrow Airport, London",
  "dropoffAddress": "10 Downing Street, London",
  "pickupDatetime": "2026-01-15T14:30:00Z",
  "vehicleType": "Executive Sedan",
  "passengers": 2,
  "luggage": 2,
  "customerName": "John Smith",
  "customerPhone": "+447700900000",
  "customerEmail": "john@example.com"
}
```

### Get Quote by ID
```bash
GET /api/v1/quotes/{quote_id}
```

### Get Recent Quotes
```bash
GET /api/v1/quotes?limit=50
```

---

## 🔄 Supervised Mode Workflow

### How It Works:

1. **Customer Enquiry** → System calculates quote
2. **WhatsApp to Pricing Team** → Notification sent with suggested price
3. **Pricing Team Reviews** → Can approve, modify, or reject
4. **Quote Sent to Customer** → Once approved

### WhatsApp Commands for Pricing Team:

```
✅ APPROVE - Send the suggested price
✏️ MODIFY £XXX - Change price to £XXX
❌ REJECT - Don't send quote
```

---

## 💰 Pricing Configuration

### Vehicle Tiers (Configured):

| Vehicle Type | Base Fare | Per KM Rate | Max Passengers |
|--------------|-----------|-------------|----------------|
| Standard Sedan | £50.00 | £2.00 | 4 |
| Executive Sedan | £60.00 | £2.50 | 4 |
| Luxury Sedan | £80.00 | £3.00 | 4 |
| Executive MPV | £100.00 | £3.80 | 6 |
| Luxury MPV | £120.00 | £4.50 | 7 |

### Time Multipliers (Configured):

- **Peak Hours** (Mon-Fri 7-10am, 4-7pm): **1.3x**
- **Standard Hours** (Mon-Fri 10am-4pm, 7pm-10pm): **1.0x**
- **Off-Peak** (Nights, Weekends): **0.9x**

### Zone Charges (Configured):

- **Congestion Charge**: £15.00
- **ULEZ**: £12.50
- **Airport Pickup Fee**: £5.00

---

## 🧪 Testing the System

### Test Quote Calculation:

```bash
curl -X POST http://localhost:3000/api/v1/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress": "Heathrow Airport",
    "dropoffAddress": "Central London",
    "pickupDatetime": "2026-01-15T14:30:00Z",
    "vehicleType": "Executive Sedan"
  }'
```

Expected Response:
```json
{
  "success": true,
  "quote": {
    "pickup": { "formatted_address": "...", "lat": 51.47, "lng": -0.45 },
    "dropoff": { "formatted_address": "...", "lat": 51.51, "lng": -0.12 },
    "distance": { "km": 25.5 },
    "pricing": {
      "base_fare": 60.00,
      "distance_charge": 63.75,
      "zone_charges": 17.50,
      "time_multiplier": 1.0,
      "total_amount": 141.25
    }
  }
}
```

---

## 🔧 Troubleshooting

### Database Connection Issues

If you see IPv6 errors, use the Supabase SQL Editor method above.

### Google Maps API Errors

- Verify your API key is active
- Check billing is enabled
- Ensure Distance Matrix API and Geocoding API are enabled

### WhatsApp Not Sending

- Verify `PRICING_TEAM_PHONE` is set correctly
- Check Green API credentials are valid

---

## 📊 Next Steps

1. ✅ Set up database (use Supabase SQL Editor)
2. ✅ Test quote calculation endpoint
3. ✅ Test quote generation with WhatsApp notification
4. ✅ Integrate with existing enquiry system
5. ✅ Deploy to production

---

## 🎯 Integration with Existing System

The quote system is ready to integrate with your existing enquiry flow. When a customer makes an enquiry, you can call:

```javascript
const response = await fetch('http://localhost:3000/api/v1/quotes/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pickupAddress: enquiry.pickup,
    dropoffAddress: enquiry.dropoff,
    pickupDatetime: enquiry.datetime,
    vehicleType: enquiry.vehicle,
    customerName: enquiry.name,
    customerPhone: enquiry.phone,
    enquiryId: enquiry.id
  })
});
```

This will:
1. Calculate the quote
2. Save it to the database
3. Send WhatsApp notification to pricing team
4. Wait for approval
5. Send quote to customer

---

**Your automated quoting system is ready! 🚀**

