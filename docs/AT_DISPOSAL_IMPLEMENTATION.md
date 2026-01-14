# At Disposal (Hourly) Booking Implementation

## 📋 Overview

This document describes the implementation of "At Disposal" (hourly) booking quotes for Jesus Travel. This allows customers to book a vehicle for a specified number of hours rather than point-to-point journeys.

---

## ✨ Features

### Core Functionality
- ✅ **Hourly rate calculation** based on vehicle type
- ✅ **Minimum 8 hours** enforced automatically
- ✅ **Congestion charge** option (£15 when applicable)
- ✅ **Time multipliers** applied (peak times, weekends, etc.)
- ✅ **Price rounding** to nearest increment
- ✅ **Customer-friendly quote formatting** for WhatsApp

### Pricing Structure

| Vehicle Type | Hourly Rate |
|--------------|-------------|
| Executive Sedan | £50/hour |
| Luxury Sedan | £60/hour |
| MPV Executive | £60/hour |
| Luxury SUV | £70/hour |
| Minibus | £60/hour |

**Note:** Hourly rates are configurable via admin settings and stored in the database.

---

## 🔧 Technical Implementation

### Backend Components

#### 1. Pricing Engine (`backend/src/services/pricing/pricingEngine.js`)

**New Function:** `calculateDisposalQuote(params)`

**Parameters:**
```javascript
{
  pickupAddress: string,      // Pickup location
  pickupDatetime: string,      // ISO 8601 datetime
  vehicleType: string,         // Vehicle type name
  hours: number,               // Requested hours (minimum 8)
  passengers: number,          // Number of passengers
  luggage: number,             // Number of luggage items
  includeCongestion: boolean   // Whether to add congestion charge
}
```

**Returns:**
```javascript
{
  booking_type: 'disposal',
  pickup: { formatted_address, lat, lng },
  hours: number,               // Actual hours (enforced minimum)
  minimum_hours: 8,
  vehicle_type: string,
  passengers: number,
  luggage: number,
  pricing: {
    hourly_rate: number,
    hourly_charge: number,     // hours × hourly_rate
    congestion_charge: number,
    subtotal: number,
    time_multiplier: number,
    time_multiplier_name: string,
    total_amount: number
  }
}
```

#### 2. Quote Controller (`backend/src/controllers/quoteController.js`)

**New Endpoint Handler:** `calculateDisposalQuoteOnly(req, res)`

Handles POST requests to `/api/v1/quotes/calculate-disposal`

#### 3. Routes (`backend/src/routes/quotes.js`)

**New Route:**
```javascript
router.post('/calculate-disposal', calculateDisposalQuoteOnly);
```

---

## 📡 API Endpoint

### Calculate Disposal Quote

**Endpoint:** `POST /api/v1/quotes/calculate-disposal`

**Request Example:**
```bash
curl -X POST https://jesus-travel-back.onrender.com/api/v1/quotes/calculate-disposal \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress": "Heathrow Airport, London",
    "pickupDatetime": "2026-01-20T09:00:00Z",
    "vehicleType": "Executive Sedan",
    "hours": 10,
    "passengers": 2,
    "luggage": 2,
    "includeCongestion": true
  }'
```

**Response Example:**
```json
{
  "success": true,
  "quote": {
    "booking_type": "disposal",
    "pickup": {
      "formatted_address": "Heathrow Airport, London, UK",
      "lat": 51.4700,
      "lng": -0.4543
    },
    "hours": 10,
    "minimum_hours": 8,
    "vehicle_type": "Executive Sedan",
    "passengers": 2,
    "luggage": 2,
    "pricing": {
      "hourly_rate": 50.0,
      "hourly_charge": 500.0,
      "congestion_charge": 15.0,
      "subtotal": 515.0,
      "time_multiplier": 1.0,
      "time_multiplier_name": "Standard Rate",
      "total_amount": 515.0
    }
  }
}
```

---

## 💬 Customer Quote Format

When sent to customers via WhatsApp:

```
✅ At Disposal Quote Ready

📍 Pickup: Heathrow Airport, London, UK
⏰ Duration: 10 hours (minimum 8 hours)
🚗 Vehicle: Executive Sedan

💰 Quote Breakdown:
   Hourly Rate (£50/hr): £500.00
   Congestion Charge:  £15.00
   ─────────────────────────
   Subtotal:          £515.00
   ─────────────────────────
   TOTAL:            £515.00

Valid for 48 hours

Reply YES to confirm booking
```

---

## 🧪 Testing

### Test Script

Run the comprehensive test script:

```bash
./test-disposal-quotes.sh
```

This tests:
1. Executive Sedan - 8 hours (minimum)
2. Luxury Sedan - 10 hours + congestion
3. Luxury SUV - 12 hours
4. MPV Executive - 6 hours (enforces minimum 8)

### Manual Testing

Test locally:
```bash
API_URL=http://localhost:3000 ./test-disposal-quotes.sh
```

Test production:
```bash
./test-disposal-quotes.sh
```

---

## 📊 Calculation Examples

### Example 1: Standard 8-hour booking
```
Vehicle: Executive Sedan
Hours: 8
Hourly Rate: £50/hour
Congestion: No

Calculation:
8 hours × £50 = £400
Total: £400.00
```

### Example 2: Extended booking with congestion
```
Vehicle: Luxury SUV
Hours: 12
Hourly Rate: £70/hour
Congestion: Yes (£15)

Calculation:
12 hours × £70 = £840
Congestion: £15
Total: £855.00
```

### Example 3: Below minimum hours
```
Vehicle: MPV Executive
Requested: 6 hours
Minimum: 8 hours
Hourly Rate: £60/hour

Calculation:
8 hours × £60 = £480 (minimum enforced)
Total: £480.00
```

---

## 🚀 Deployment

### Git Commits
- **c75b996** - Add At Disposal quote calculation with API endpoint
- **1ba6f58** - Add test script for disposal calculations

### Deployment Status
✅ Code pushed to GitHub  
⏳ Render auto-deployment in progress

Check deployment: https://dashboard.render.com/

---

## 📝 Next Steps

1. ✅ Backend implementation complete
2. ⏳ Wait for Render deployment
3. 🔜 Add disposal booking type to frontend forms
4. 🔜 Update admin dashboard to show disposal bookings
5. 🔜 Test end-to-end booking flow

---

## 🔗 Related Files

- `backend/src/services/pricing/pricingEngine.js` - Core pricing logic
- `backend/src/controllers/quoteController.js` - API endpoint handlers
- `backend/src/routes/quotes.js` - Route definitions
- `test-disposal-quotes.sh` - Test script

---

**Last Updated:** 2026-01-14  
**Status:** ✅ Backend Complete | ⏳ Deployment Pending

