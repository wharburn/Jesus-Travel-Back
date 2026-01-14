# At Disposal AI Estimate Fix

## Problem
The AI estimate for At Disposal bookings was showing incorrect prices (e.g., £120.50 instead of £480 for an 8-hour minimum MPV Executive booking).

## Root Cause
The `Enquiry` model didn't have fields to distinguish between:
- **Point-to-point bookings** (pickup → dropoff)
- **At Disposal bookings** (hourly rental with 8-hour minimum)

When calculating the AI estimate, the system always used `calculateQuote()` (point-to-point calculator) instead of `calculateDisposalQuote()` for disposal bookings.

## Solution

### 1. Updated Enquiry Model
Added three new fields to `backend/src/models/Enquiry.js`:

```javascript
this.bookingType = data.bookingType || 'point-to-point'; // 'point-to-point' or 'disposal'
this.hours = data.hours || null; // For disposal bookings
this.includeCongestion = data.includeCongestion || false; // For disposal bookings
```

### 2. Updated AI Estimate Calculation
Modified `backend/src/controllers/enquiryController.js` to:

- Import `calculateDisposalQuote` function
- Check `enquiry.bookingType` to determine which calculator to use
- Call `calculateDisposalQuote()` for disposal bookings
- Call `calculateQuote()` for point-to-point bookings
- Store appropriate breakdown information for each type

### 3. Updated createEnquiry Function
Modified the enquiry creation to accept the new fields:

```javascript
const enquiryData = {
  // ... existing fields ...
  bookingType: req.body.bookingType || 'point-to-point',
  hours: req.body.hours || null,
  includeCongestion: req.body.includeCongestion || false,
  source: req.body.source || 'web',
};
```

## Testing

### Test Script
Created `test-disposal-ai-estimate.sh` to verify the fix:

```bash
./test-disposal-ai-estimate.sh
```

### Expected Results
For an MPV Executive At Disposal booking:
- **6 hours requested** → Enforces 8-hour minimum → £480
- **10 hours requested** → £600 (10 × £60/hr)
- **10 hours + congestion** → £615 (10 × £60/hr + £15)

## Deployment

### Files Changed
1. `backend/src/models/Enquiry.js` - Added bookingType, hours, includeCongestion fields
2. `backend/src/controllers/enquiryController.js` - Updated AI estimate logic
3. `test-disposal-ai-estimate.sh` - Test script

### Deployment Steps
```bash
git add backend/src/models/Enquiry.js backend/src/controllers/enquiryController.js test-disposal-ai-estimate.sh
git commit -m "Fix At Disposal AI estimate calculation"
git push origin main
```

Render will auto-deploy the changes.

## Next Steps

### Frontend Integration
To fully support At Disposal bookings, the frontend booking form needs to be updated to:

1. Add a booking type selector (Point-to-Point vs At Disposal)
2. Show/hide dropoff field based on booking type
3. Add hours input field for disposal bookings
4. Add congestion charge checkbox for disposal bookings

### Example Frontend Form
```html
<select id="bookingType">
  <option value="point-to-point">Point to Point</option>
  <option value="disposal">At Disposal (Hourly)</option>
</select>

<div id="disposalFields" style="display: none;">
  <input type="number" id="hours" min="8" placeholder="Hours (min 8)" />
  <label>
    <input type="checkbox" id="includeCongestion" />
    Include Congestion Charge (£15)
  </label>
</div>
```

## Verification

After deployment, verify the fix by creating a test enquiry:

```bash
curl -X POST "https://jesus-travel-back.onrender.com/api/v1/enquiries" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerPhone": "+447700900123",
    "pickupLocation": "Heathrow Terminal 4",
    "pickupDate": "2026-01-22",
    "pickupTime": "10:00",
    "vehicleType": "MPV Executive",
    "bookingType": "disposal",
    "hours": 10,
    "includeCongestion": true,
    "passengers": 5
  }'
```

Expected AI estimate: **£615** (10 hours × £60/hr + £15 congestion)

## Summary

✅ **Fixed**: At Disposal bookings now calculate correct AI estimates  
✅ **Enforced**: 8-hour minimum for all disposal bookings  
✅ **Tested**: Disposal quote calculator working correctly  
🔜 **Next**: Update frontend to support disposal booking type selection

---

**Last Updated:** 2026-01-14  
**Status:** Backend Fix Complete | Frontend Integration Pending

