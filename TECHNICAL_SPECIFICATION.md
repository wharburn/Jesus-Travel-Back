# 🔧 MCP Quoting System - Technical Specification

## 📐 System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Customer Layer                            │
│  WhatsApp ←→ Green API ←→ Your Backend ←→ OpenRouter (Claude)  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Enquiry Processing Layer                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Extract    │ →  │   Validate   │ →  │ Create       │     │
│  │   Info (AI)  │    │   Data       │    │ Enquiry      │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  NEW: MCP Pricing Engine Layer                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  Calculate   │ →  │   Check      │ →  │  Generate    │     │
│  │  Distance    │    │   Zones      │    │  Quote       │     │
│  │ (Google Maps)│    │ (Geo-fence)  │    │ (Formula)    │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Decision & Routing Layer                      │
│                                                                  │
│  IF quote < threshold:                                          │
│    → Auto-approve → Send to customer                           │
│  ELSE:                                                          │
│    → Send to pricing team → Manual review                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Storage & Analytics                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │    Redis     │    │  PostgreSQL  │    │   Upstash    │     │
│  │  (Enquiries) │    │   (Quotes)   │    │  (Search)    │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Data Flow

### 1. Customer Enquiry Flow (NEW)
```
Customer sends WhatsApp message
    ↓
AI extracts: pickup, dropoff, date, time, passengers, vehicle
    ↓
Create Enquiry in Redis (status: pending_quote)
    ↓
[NEW] Call MCP Pricing Engine:
    ├─ Get distance from Google Maps API
    ├─ Check if pickup/dropoff in Congestion Zone
    ├─ Check if pickup/dropoff in ULEZ Zone
    ├─ Calculate time multiplier (peak/off-peak)
    ├─ Get vehicle tier pricing from PostgreSQL
    ├─ Apply formula: (base + distance + zones) × multiplier
    └─ Return quote breakdown
    ↓
IF quote.total < AUTO_QUOTE_THRESHOLD:
    ├─ Update Enquiry (status: quoted, auto-approved: true)
    ├─ Save quote to PostgreSQL
    ├─ Send quote to customer via WhatsApp
    └─ Log: "Auto-quote sent"
ELSE:
    ├─ Update Enquiry (status: pending_review)
    ├─ Save suggested quote to PostgreSQL
    ├─ Send to pricing team with suggestion
    └─ Wait for manual approval
```

### 2. Manual Override Flow
```
Pricing team receives suggested quote
    ↓
Reviews breakdown in admin dashboard
    ↓
OPTIONS:
    ├─ Approve as-is → Send to customer
    ├─ Modify price → Update quote → Send to customer
    └─ Reject → Request more info from customer
```

### 3. Quote Acceptance Flow
```
Customer receives quote via WhatsApp
    ↓
Customer replies "YES" or "CONFIRM"
    ↓
AI detects acceptance
    ↓
Create Booking in PostgreSQL
    ├─ Link to quote_id
    ├─ Status: confirmed
    ├─ Generate booking reference
    └─ Calculate deposit (20% of total)
    ↓
Send confirmation to customer:
    ├─ Booking reference
    ├─ Payment instructions
    └─ (Optional) PDF confirmation
```

---

## 🧮 Pricing Calculation Engine

### Core Algorithm
```javascript
function calculateQuote(enquiry) {
  // 1. Get distance and duration
  const { distance_km, duration_min } = await getDistanceFromGoogleMaps(
    enquiry.pickupLocation,
    enquiry.dropoffLocation
  );
  
  // 2. Get vehicle pricing
  const vehiclePricing = await getPricingRule(enquiry.vehicleType);
  const baseFare = vehiclePricing.baseFare;
  const distanceCharge = distance_km * vehiclePricing.perKmRate;
  
  // 3. Check zones
  const congestionCharge = await isInCongestionZone(
    enquiry.pickupLocation,
    enquiry.dropoffLocation,
    enquiry.pickupDate
  ) ? 15.00 : 0;
  
  const ulezCharge = await isInULEZZone(
    enquiry.pickupLocation,
    enquiry.dropoffLocation
  ) ? 12.50 : 0;
  
  // 4. Calculate time multiplier
  const timeMultiplier = getTimeMultiplier(
    enquiry.pickupDate,
    enquiry.pickupTime
  );
  
  // 5. Calculate subtotal and total
  const subtotal = baseFare + distanceCharge + congestionCharge + ulezCharge;
  const total = subtotal * timeMultiplier;
  
  // 6. Round to nearest £0.50
  const roundedTotal = Math.ceil(total * 2) / 2;
  
  return {
    distance_km,
    duration_min,
    baseFare,
    distanceCharge,
    congestionCharge,
    ulezCharge,
    timeMultiplier,
    subtotal,
    total: roundedTotal,
    breakdown: {
      vehicle: enquiry.vehicleType,
      route: `${enquiry.pickupLocation} → ${enquiry.dropoffLocation}`,
      distance: `${distance_km} km`,
      duration: `${duration_min} mins`,
      charges: [
        { item: 'Base Fare', amount: baseFare },
        { item: 'Distance Charge', amount: distanceCharge },
        { item: 'Congestion Charge', amount: congestionCharge },
        { item: 'ULEZ Charge', amount: ulezCharge },
        { item: 'Time Multiplier', amount: `${timeMultiplier}x` }
      ]
    }
  };
}
```

---

## 🗺️ Google Maps Integration

### Distance Matrix API Call
```javascript
async function getDistanceFromGoogleMaps(origin, destination) {
  const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
  
  const params = {
    origins: origin,
    destinations: destination,
    mode: 'driving',
    units: 'metric',
    departure_time: 'now', // For traffic-aware routing
    key: process.env.GOOGLE_MAPS_API_KEY
  };
  
  const response = await axios.get(url, { params });
  
  if (response.data.status !== 'OK') {
    throw new Error(`Google Maps API error: ${response.data.status}`);
  }
  
  const element = response.data.rows[0].elements[0];
  
  if (element.status !== 'OK') {
    throw new Error(`Route not found: ${element.status}`);
  }
  
  return {
    distance_km: element.distance.value / 1000, // Convert meters to km
    duration_min: Math.ceil(element.duration.value / 60), // Convert seconds to minutes
    distance_text: element.distance.text,
    duration_text: element.duration.text
  };
}
```

### Geocoding for Zone Detection
```javascript
async function geocodeAddress(address) {
  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  
  const params = {
    address: address,
    key: process.env.GOOGLE_MAPS_API_KEY
  };
  
  const response = await axios.get(url, { params });
  
  if (response.data.status !== 'OK') {
    throw new Error(`Geocoding failed: ${response.data.status}`);
  }
  
  const location = response.data.results[0].geometry.location;
  
  return {
    lat: location.lat,
    lng: location.lng,
    formatted_address: response.data.results[0].formatted_address
  };
}
```

---


