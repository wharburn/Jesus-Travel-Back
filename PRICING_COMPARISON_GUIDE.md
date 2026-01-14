# 📊 Pricing Comparison Guide - For Pricing Team

## Two Prices Displayed in Admin Dashboard

When you view an enquiry, you'll see **TWO different price estimates**. Both are shown to help you compare and choose the best quote.

---

## 🤖 AI Price Estimate (Backend)

**Location:** Top blue box in enquiry details

**What it is:**
- Calculated automatically by the backend server when the booking was created
- Uses the full pricing engine with all rules

**Includes:**
- ✅ Base fare (vehicle type)
- ✅ Distance charge (per km)
- ✅ Zone charges (airports, congestion, ULEZ)
- ✅ Time multipliers (peak hours, weekends, holidays)
- ✅ Add-ons (if specified)

**Advantages:**
- Complete pricing with all charges
- Consistent (doesn't change)
- Historical record of what was calculated

**When to use:**
- When the route includes airports or city center
- For bookings during peak hours or weekends
- When you want the most comprehensive estimate

**Example:**
```
Heathrow → Central London
Friday 5 PM, Standard Sedan

Base Fare:           £60.00
Distance (25 km):    £50.00
Heathrow Fee:        £5.00
Congestion Charge:   £15.00
Peak Hour (1.2x):    £26.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI ESTIMATE:         £156.00
```

---

## 📍 Live Estimate (Frontend)

**Location:** Yellow box below AI estimate

**What it is:**
- Calculated live when you open the enquiry
- Uses current Google Maps data
- Simple formula: Base + Distance only

**Includes:**
- ✅ Base fare (vehicle type)
- ✅ Distance charge (per km)
- ❌ NO zone charges
- ❌ NO time multipliers
- ❌ NO add-ons

**Advantages:**
- Uses current traffic/route data
- Quick and simple
- Shows live route on map

**When to use:**
- For simple point-to-point journeys
- When no special zones or peak times apply
- As a quick sanity check

**Example:**
```
Heathrow → Central London
Standard Sedan

Base Fare:           £60.00
Distance (25 km):    £50.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIVE ESTIMATE:       £110.00
```

---

## 💡 How to Use Both Prices

### **Scenario 1: Simple Journey**
**Route:** Residential area → Residential area  
**Time:** Midday Tuesday  

**AI Estimate:** £85  
**Live Estimate:** £82  

**Action:** Use either (they're similar because no zones/multipliers apply)

---

### **Scenario 2: Airport Pickup**
**Route:** Heathrow → Central London  
**Time:** Friday 5 PM  

**AI Estimate:** £156 (includes airport fee, congestion, peak multiplier)  
**Live Estimate:** £110 (basic calculation only)  

**Action:** Use **AI Estimate** (Live is missing £46 in charges!)

---

### **Scenario 3: Live Estimate is Higher**
**Route:** London Bridge → Canary Wharf  
**Time:** Tuesday 2 PM  

**AI Estimate:** £45  
**Live Estimate:** £52  

**Possible reasons:**
- Traffic conditions changed since booking
- Route changed (roadworks, closures)
- Google Maps using different route

**Action:** 
- Check the map to see the route
- Use your judgment based on current conditions
- Consider using Live Estimate if traffic is bad

---

## 🎯 Best Practice

1. **Always check BOTH prices**
2. **Compare them** - if they're very different, investigate why
3. **Use AI Estimate** as baseline (it's more complete)
4. **Adjust based on Live Estimate** if current conditions differ
5. **Add your expertise** - you know the routes better than any algorithm!

---

## 📈 Tracking Over Time

**Why we show both:**
- To see which pricing method is more accurate
- To improve the AI pricing engine
- To give you flexibility in quoting

**Please note:**
- If Live Estimate is consistently better, we'll improve the AI
- If AI Estimate is consistently better, we'll simplify the display
- Your feedback helps us optimize pricing!

---

## 🔧 Quick Reference

| Feature | AI Estimate | Live Estimate |
|---------|-------------|---------------|
| **When calculated** | At booking time | When you open modal |
| **Includes zones** | ✅ Yes | ❌ No |
| **Includes time multipliers** | ✅ Yes | ❌ No |
| **Uses current traffic** | ❌ No | ✅ Yes |
| **Shows on map** | ❌ No | ✅ Yes |
| **Best for** | Complete pricing | Quick reference |

---

## ❓ Questions?

If you notice:
- Prices are consistently very different
- One method is always more accurate
- Customers complaining about quotes

**Let the admin know** so we can adjust the pricing engine!

---

**Last Updated:** 2026-01-14  
**Status:** Both prices active for comparison

