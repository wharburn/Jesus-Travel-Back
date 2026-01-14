# 🔧 Pricing Team Phone Number Fix

## Problem

When you changed the pricing team phone number in the **Admin Settings** panel, WhatsApp messages were still being sent to the old number.

## Root Cause

The backend code was reading the pricing team phone number from **two different sources**:

1. **Environment Variable** (`process.env.PRICING_TEAM_PHONE` in `.env` file)
2. **Redis Settings** (updated via Admin Settings panel)

Most of the code was reading directly from the environment variable instead of checking Redis first.

## Solution Applied

Updated all backend files to:
1. **First** check Redis settings for the pricing team phone
2. **Fallback** to environment variable if not set in Redis

### Files Modified:

#### 1. `backend/src/controllers/enquiryController.js`
- ✅ `notifyPricingTeamManual()` - Now reads from Redis settings
- ✅ Auto-quote notification - Now reads from Redis settings

#### 2. `backend/src/services/whatsapp/messageHandler.js`
- ✅ Already had `getSetting('pricingTeam.phone')` in main message handler
- ✅ Updated `handlePricingTeamQuote()` - Now reads from Redis settings
- ✅ Updated error handlers - Now reads from Redis settings
- ✅ Updated WhatsApp booking notifications - Now reads from Redis settings

## How It Works Now

```javascript
// Get pricing team phone from settings (with fallback to env var)
const settings = await redis.get('settings');
const pricingTeamPhone = settings?.pricingTeam?.phone || process.env.PRICING_TEAM_PHONE;
```

**Priority:**
1. **Redis settings** (updated via Admin Settings panel) ← **Primary source**
2. **Environment variable** (`.env` file) ← **Fallback**

## Testing

### Test 1: Update via Admin Settings
1. Go to Admin Settings (`admin-settings.html`)
2. Update "Pricing Team Phone" to a new number
3. Click "Save Settings"
4. Create a new booking
5. ✅ WhatsApp notification should go to the **new number**

### Test 2: Verify Settings
```bash
# Check current settings in Redis
curl -X GET https://jesus-travel-back.onrender.com/api/v1/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 3: Create Test Booking
```bash
# Create a test booking to trigger WhatsApp notification
curl -X POST https://jesus-travel-back.onrender.com/api/v1/enquiries \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerPhone": "+447700900000",
    "customerEmail": "test@example.com",
    "pickupLocation": "Heathrow Airport",
    "dropoffLocation": "London Bridge",
    "pickupDate": "2026-01-20",
    "pickupTime": "10:00",
    "passengers": 2,
    "vehicleType": "saloon"
  }'
```

## Deployment

The changes have been made to the local codebase. To deploy:

```bash
cd backend
git add .
git commit -m "Fix: Read pricing team phone from Redis settings instead of env var"
git push
```

Render will automatically deploy the changes.

## Verification After Deployment

1. **Check Render logs** for any errors
2. **Update pricing team phone** in Admin Settings
3. **Create a test booking** to verify WhatsApp goes to new number
4. **Check WhatsApp** to confirm message received

## Fallback Behavior

If Redis settings are not configured, the system will automatically fall back to the environment variable:

- **Redis settings exist** → Use Redis value ✅
- **Redis settings empty** → Use `.env` value ✅
- **Both empty** → No notification sent (warning logged)

## Future Improvements

Consider adding:
- ✅ Real-time validation of phone number format in Admin Settings
- ✅ Test WhatsApp button in Admin Settings (send test message)
- ✅ Display current active phone number in Admin Dashboard
- ✅ Notification history log

---

**Status:** ✅ Fixed and ready for deployment
**Date:** 2026-01-14

