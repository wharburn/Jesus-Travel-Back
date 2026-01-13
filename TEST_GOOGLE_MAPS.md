# 🗺️ Testing Google Maps Integration

## Issue Found
The Google Maps API key on Render was different from the working local key.

## Solution
Update Render environment variable to use the correct API key.

---

## ✅ Your Working API Key

```
GOOGLE_MAPS_API_KEY=AIzaSyDtkzW3zbExrKKowMYZy83pQp9I5fciM2Y
```

This key is working locally and should be used on Render.

---

## 🔧 How to Update on Render

1. Go to https://dashboard.render.com/
2. Select your backend service (e.g., "jesus-travel-back")
3. Click **Environment** in the left sidebar
4. Find `GOOGLE_MAPS_API_KEY`
5. Click **Edit** (pencil icon)
6. Replace with: `AIzaSyDtkzW3zbExrKKowMYZy83pQp9I5fciM2Y`
7. Click **Save Changes**
8. Wait for automatic redeployment (2-5 minutes)

---

## 🧪 Test 1: Backend AI Estimate (Local)

Run this to test if the backend can calculate AI estimates:

```bash
cd backend
node test-ai-estimate.js
```

**Expected Output:**
```
✅ SUCCESS! AI Estimate Calculated:
   💰 Total Price: £XXX
   📏 Distance: XX.X km
   ⏱️  Duration: XX mins
```

---

## 🧪 Test 2: WhatsApp Integration (Local)

Run this to test if WhatsApp messages can be sent:

```bash
cd backend
node test-whatsapp.js
```

**Expected Output:**
```
✅ WhatsApp integration is working!
💡 Check your phone to confirm you received the message.
```

---

## 🧪 Test 3: Frontend Map Display

1. Open your admin dashboard: https://your-frontend-url/admin-dashboard.html
2. Login with your admin credentials
3. Click on any enquiry to view details
4. Check the browser console (F12 → Console tab)

**What to look for:**

✅ **Success:**
```
🗺️ Loading Google Maps API key from backend...
Google Maps API key received: AIzaSyDtkz...
✅ Google Maps API loaded successfully
```

❌ **Failure:**
```
⚠️ Google Maps API key is not configured on the backend
```
or
```
❌ Failed to load Google Maps API script
```

---

## 📊 What Each Component Does

### Backend (Render)
- Needs `GOOGLE_MAPS_API_KEY` to calculate distances and AI estimates
- Used when creating new enquiries
- Sends WhatsApp messages with AI price estimates

### Frontend (Admin Dashboard)
- Fetches the API key from backend via `/api/v1/settings/maps-api-key`
- Loads Google Maps JavaScript library
- Displays route maps in enquiry details

---

## 🔍 Troubleshooting

### If AI Estimate Still Shows "Unavailable"

Check Render logs for:
```
❌ Could not calculate AI estimate for JT-2026-XXXXX:
```

The error message will tell you exactly what's wrong.

### If Map Still Doesn't Show

1. Open browser console (F12)
2. Look for Google Maps errors
3. Common issues:
   - `RefererNotAllowedMapError` - API key is restricted to specific domains
   - `ApiNotActivatedMapError` - Maps JavaScript API not enabled
   - `RequestDeniedMapError` - Billing not enabled

### If WhatsApp Messages Not Sending

1. Check `GREEN_API_INSTANCE_ID` and `GREEN_API_TOKEN` are set on Render
2. Verify WhatsApp instance is authorized at https://console.green-api.com/
3. Check `PRICING_TEAM_PHONE` is set correctly (format: +447822027794)

---

## ✅ Final Checklist

After updating the API key on Render:

- [ ] Render deployment completed successfully
- [ ] Submit a test booking through the website
- [ ] WhatsApp message received with AI estimate
- [ ] AI estimate shows price, distance, and duration (not "unavailable")
- [ ] Admin dashboard map displays correctly
- [ ] No errors in browser console

---

## 📝 Notes

- The API key `AIzaSyDtkzW3zbExrKKowMYZy83pQp9I5fciM2Y` is working locally
- Make sure this exact key is used on Render
- If you need to use a different key, ensure:
  - Distance Matrix API is enabled
  - Geocoding API is enabled
  - Maps JavaScript API is enabled
  - Billing is enabled in Google Cloud Console
  - No domain restrictions (or add your domains to allowed list)

---

## 🆘 Still Having Issues?

Share:
1. Render deployment logs (after updating the API key)
2. Browser console output (when viewing enquiry details)
3. Screenshot of the WhatsApp message you receive
4. Output from the test scripts above

I'll help you debug further!

