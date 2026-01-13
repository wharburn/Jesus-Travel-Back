# 🔧 Troubleshooting: AI Estimate Unavailable

## Problem
When a new booking enquiry is submitted, the WhatsApp message shows:
```
⚠️ AI estimate unavailable
```

## Root Cause
The AI estimate calculation is failing, most likely due to one of these reasons:

### 1. **Google Maps API Key Not Configured** (Most Common)
The backend needs `GOOGLE_MAPS_API_KEY` to calculate distances and routes.

### 2. **Google Maps API Quota Exceeded**
You might have hit the free tier limit (40,000 requests/month).

### 3. **Google Maps API Key Restrictions**
The API key might be restricted to certain domains/IPs.

### 4. **Invalid Addresses**
The pickup or dropoff addresses cannot be geocoded by Google Maps.

---

## 🔍 Diagnostic Steps

### Step 1: Check Backend Logs
Look at your Render deployment logs for error messages like:
```
❌ Could not calculate AI estimate for JT-2026-XXXXX:
```

The error message will tell you exactly what's wrong.

### Step 2: Use the Diagnostics Endpoint
I've added a new endpoint to check system health:

**URL:** `https://your-backend.onrender.com/api/v1/settings/diagnostics`

**Method:** GET

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-01-13T...",
    "environment": {
      "nodeEnv": "production",
      "port": "10000"
    },
    "apis": {
      "googleMaps": {
        "configured": true,
        "keyPrefix": "AIzaSyDtkz..."
      },
      "upstashRedis": {
        "configured": true
      },
      "openRouter": {
        "configured": true
      },
      "greenApi": {
        "configured": true
      }
    },
    "pricing": {
      "autoQuoteMode": false,
      "pricingMode": "supervised",
      "pricingTeamPhone": "+44782...",
      "rulesLoaded": true,
      "rulesCount": 5
    }
  }
}
```

**What to check:**
- `apis.googleMaps.configured` should be `true`
- `apis.googleMaps.keyPrefix` should show the first 10 characters of your API key
- `pricing.rulesLoaded` should be `true`

---

## ✅ Solutions

### Solution 1: Add Google Maps API Key to Render

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add a new environment variable:
   - **Key:** `GOOGLE_MAPS_API_KEY`
   - **Value:** `AIzaSyDtkzW3zbExrKKowMYZy83pQp9I5fciM2Y` (your existing key)
5. Click **Save Changes**
6. Render will automatically redeploy your backend

### Solution 2: Check Google Maps API Quota

1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to **APIs & Services** → **Dashboard**
4. Check the usage for:
   - Distance Matrix API
   - Geocoding API
5. If you've exceeded the quota, you'll need to:
   - Wait for the quota to reset (monthly)
   - Enable billing to increase quota
   - Or temporarily disable AI estimates

### Solution 3: Remove API Key Restrictions

1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your API key
5. Under **API restrictions**, select **Don't restrict key** (for testing)
6. Under **Application restrictions**, select **None** (for testing)
7. Click **Save**

**Note:** For production, you should restrict the key to only the APIs you need (Distance Matrix API and Geocoding API).

### Solution 4: Test with a Simple Booking

Try creating a booking with well-known addresses:
- **Pickup:** `Heathrow Airport, London`
- **Dropoff:** `10 Downing Street, London`

If this works, the issue is with the specific addresses being entered.

---

## 🧪 Testing the Fix

After applying the solution:

1. **Check the diagnostics endpoint** to verify Google Maps is configured
2. **Submit a test booking** through the website
3. **Check WhatsApp** - you should now see:
   ```
   🤖 AI PRICE ESTIMATE: £XX.XX
   📏 Distance: X.X km (XX mins)
   ⏰ Standard pricing
   ```

---

## 📊 Monitoring

The improved error logging will now show:
- The exact error message
- The pickup and dropoff addresses
- Whether Google Maps API key is configured
- The full error stack trace

Check your Render logs after each booking to see detailed diagnostics.

---

## 🆘 Still Not Working?

If you've tried all the above and it's still not working:

1. Share the output from the `/api/v1/settings/diagnostics` endpoint
2. Share the error logs from Render (the lines starting with `❌ Could not calculate AI estimate`)
3. Share a screenshot of the WhatsApp message you're receiving

I'll help you debug further!

