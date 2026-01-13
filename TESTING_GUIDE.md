# 🧪 Testing Guide - Auto-Quote System

## ✅ Git Push Complete!

All changes have been pushed to GitHub. The system is ready for testing on your deployment platform.

---

## 📋 Pre-Testing Checklist

### 1. Environment Variables

Make sure these are set in your deployment environment (Render, etc.):

```bash
# Required for Auto-Quote
AUTO_QUOTE_MODE=false              # Start with manual mode for testing
GOOGLE_MAPS_API_KEY=your-key-here  # Required for distance calculation

# Existing variables (verify they're set)
GREEN_API_INSTANCE_ID=your-instance-id
GREEN_API_TOKEN=your-token
PRICING_TEAM_PHONE=+447822027794
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 2. Database Setup

The system uses **Redis** (already configured) for:
- Settings storage (including auto-quote mode)
- Enquiry data
- Quote data

**No additional database setup needed!** ✅

---

## 🧪 Testing Sequence

### Test 1: Manual Mode (Default)

**Objective**: Verify the existing manual workflow still works

1. **Submit a test booking** via website
2. **Check WhatsApp** - Pricing team should receive notification
3. **Submit quote** via WhatsApp: `QUOTE JT-2026-XXXXX £150`
4. **Verify** customer receives quote

**Expected Result**: ✅ Manual workflow works as before

---

### Test 2: Enable Auto-Quote Mode

**Objective**: Enable auto-quote via admin dashboard

1. **Login to Admin Dashboard**
   - URL: `https://your-domain.com/admin-dashboard.html`
   - Use admin credentials

2. **Navigate to Settings**
   - Click "Settings" button

3. **Enable Auto-Quote Mode**
   - Find "Auto-Quote Mode" section (yellow box)
   - Toggle switch to **ON**
   - Click "Save Changes"

4. **Verify Settings Saved**
   - Refresh page
   - Check toggle is still ON

**Expected Result**: ✅ Auto-quote mode enabled in dashboard

---

### Test 3: Auto-Quote Calculation

**Objective**: Test automatic quote generation

1. **Submit test booking** with these details:
   ```
   Pickup: Heathrow Airport, London
   Dropoff: 10 Downing Street, London
   Date: Tomorrow
   Time: 10:00
   Vehicle: Executive Sedan
   Passengers: 2
   ```

2. **Check Customer WhatsApp** (use your number for testing)
   - Should receive instant quote
   - Quote should include:
     - Total price
     - Distance and duration
     - Zones detected (Heathrow, ULEZ)
     - Time multiplier
     - Validity period

3. **Check Pricing Team WhatsApp**
   - Should receive monitoring notification
   - Shows auto-quote was sent
   - Includes quote details

4. **Check Admin Dashboard**
   - Enquiry should show status: "quoted"
   - Click on enquiry to see breakdown
   - Verify all pricing components

**Expected Result**: ✅ Auto-quote sent instantly with full breakdown

---

### Test 4: Zone Detection

**Objective**: Verify zone charges are calculated

Test with different locations:

1. **Airport Zone**
   ```
   Pickup: Gatwick Airport
   Dropoff: Brighton
   Expected: +£5 airport charge
   ```

2. **ULEZ Zone**
   ```
   Pickup: Central London (e.g., Oxford Street)
   Dropoff: Canary Wharf
   Expected: +£12.50 ULEZ charge
   ```

3. **Multiple Zones**
   ```
   Pickup: Heathrow Airport
   Dropoff: City of London
   Expected: +£5 airport + £12.50 ULEZ + £15 congestion
   ```

**Expected Result**: ✅ Correct zone charges applied

---

### Test 5: Time Multipliers

**Objective**: Verify peak/off-peak pricing

1. **Peak Morning** (07:00-09:30)
   - Submit booking for 08:00
   - Expected: 1.3x multiplier

2. **Peak Evening** (17:00-19:30)
   - Submit booking for 18:00
   - Expected: 1.2x multiplier

3. **Off-Peak Night** (22:00-06:00)
   - Submit booking for 23:00
   - Expected: 0.9x multiplier

**Expected Result**: ✅ Correct time multipliers applied

---

### Test 6: Error Handling & Fallback

**Objective**: Verify system falls back to manual mode on errors

1. **Test with invalid address**
   ```
   Pickup: INVALID_ADDRESS_12345
   Dropoff: London
   ```

2. **Check behavior**
   - System should detect error
   - Fall back to manual mode
   - Notify pricing team for manual quote

**Expected Result**: ✅ Graceful fallback to manual mode

---

### Test 7: Manual Override

**Objective**: Verify pricing team can modify auto-quotes

1. **After auto-quote is sent**
2. **Login to admin dashboard**
3. **Find the enquiry**
4. **Modify the quote** (change price)
5. **Resend to customer**

**Expected Result**: ✅ Team can override auto-quotes

---

## 📊 Test Results Template

```markdown
## Test Results - [Date]

### Test 1: Manual Mode
- [ ] Booking submitted
- [ ] Team notification received
- [ ] Quote sent via WhatsApp
- [ ] Customer received quote
Status: ✅ PASS / ❌ FAIL

### Test 2: Enable Auto-Quote
- [ ] Dashboard login successful
- [ ] Settings page loaded
- [ ] Auto-quote toggle enabled
- [ ] Settings saved
Status: ✅ PASS / ❌ FAIL

### Test 3: Auto-Quote Calculation
- [ ] Booking submitted
- [ ] Customer received instant quote
- [ ] Team received notification
- [ ] Dashboard shows quoted status
- [ ] Breakdown is correct
Status: ✅ PASS / ❌ FAIL

### Test 4: Zone Detection
- [ ] Airport zone detected
- [ ] ULEZ zone detected
- [ ] Multiple zones detected
Status: ✅ PASS / ❌ FAIL

### Test 5: Time Multipliers
- [ ] Peak morning (1.3x)
- [ ] Peak evening (1.2x)
- [ ] Off-peak night (0.9x)
Status: ✅ PASS / ❌ FAIL

### Test 6: Error Handling
- [ ] Invalid address handled
- [ ] Fallback to manual mode
- [ ] Team notified
Status: ✅ PASS / ❌ FAIL

### Test 7: Manual Override
- [ ] Quote modified in dashboard
- [ ] Updated quote sent
Status: ✅ PASS / ❌ FAIL
```

---

## 🐛 Troubleshooting

### Auto-quotes not sending?

```bash
# Check logs on Render
# Look for "Auto-quote" entries
```

### Quotes seem incorrect?

1. Check Google Maps API key is valid
2. Verify pricing rules in code
3. Check zone definitions
4. Review time multiplier logic

### Dashboard not showing toggle?

1. Clear browser cache
2. Hard refresh (Cmd+Shift+R)
3. Check admin-settings.html deployed

---

## 📞 Support

- **Documentation**: See `README_AUTO_QUOTE.md`
- **Quick Start**: See `QUICK_START_AUTO_QUOTE.md`
- **Full Guide**: See `AUTO_QUOTE_MODE_GUIDE.md`

---

**Ready to test!** 🚀

