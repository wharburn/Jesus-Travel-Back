#!/bin/bash

echo "🧪 Testing At Disposal Quote System"
echo "===================================="
echo ""

API_URL="${API_URL:-https://jesus-travel-back.onrender.com}"

# Test 1: Executive Sedan - 8 hours (minimum)
echo "Test 1: Executive Sedan - 8 hours (minimum)"
echo "Expected: 8 hours × £50/hr = £400"
curl -X POST "$API_URL/api/v1/quotes/calculate-disposal" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress": "Heathrow Airport, London",
    "pickupDatetime": "2026-01-20T09:00:00Z",
    "vehicleType": "Executive Sedan",
    "hours": 8,
    "passengers": 2,
    "luggage": 2,
    "includeCongestion": false
  }' 2>/dev/null | jq '{
    vehicle: .quote.vehicle_type,
    hours: .quote.hours,
    hourly_rate: .quote.pricing.hourly_rate,
    hourly_charge: .quote.pricing.hourly_charge,
    congestion: .quote.pricing.congestion_charge,
    total: .quote.pricing.total_amount
  }'

echo ""
echo "---"
echo ""

# Test 2: Luxury Sedan - 10 hours with congestion
echo "Test 2: Luxury Sedan - 10 hours + congestion"
echo "Expected: 10 hours × £60/hr + £15 = £615"
curl -X POST "$API_URL/api/v1/quotes/calculate-disposal" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress": "Central London",
    "pickupDatetime": "2026-01-20T08:00:00Z",
    "vehicleType": "Luxury Sedan",
    "hours": 10,
    "passengers": 2,
    "luggage": 2,
    "includeCongestion": true
  }' 2>/dev/null | jq '{
    vehicle: .quote.vehicle_type,
    hours: .quote.hours,
    hourly_rate: .quote.pricing.hourly_rate,
    hourly_charge: .quote.pricing.hourly_charge,
    congestion: .quote.pricing.congestion_charge,
    total: .quote.pricing.total_amount
  }'

echo ""
echo "---"
echo ""

# Test 3: Luxury SUV - 12 hours
echo "Test 3: Luxury SUV - 12 hours"
echo "Expected: 12 hours × £70/hr = £840"
curl -X POST "$API_URL/api/v1/quotes/calculate-disposal" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress": "Mayfair, London",
    "pickupDatetime": "2026-01-20T10:00:00Z",
    "vehicleType": "Luxury SUV",
    "hours": 12,
    "passengers": 3,
    "luggage": 3,
    "includeCongestion": false
  }' 2>/dev/null | jq '{
    vehicle: .quote.vehicle_type,
    hours: .quote.hours,
    hourly_rate: .quote.pricing.hourly_rate,
    hourly_charge: .quote.pricing.hourly_charge,
    total: .quote.pricing.total_amount
  }'

echo ""
echo "---"
echo ""

# Test 4: MPV Executive - 6 hours (should enforce minimum 8)
echo "Test 4: MPV Executive - 6 hours (should enforce minimum 8)"
echo "Expected: 8 hours × £60/hr = £480 (minimum enforced)"
curl -X POST "$API_URL/api/v1/quotes/calculate-disposal" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress": "Gatwick Airport",
    "pickupDatetime": "2026-01-20T14:00:00Z",
    "vehicleType": "MPV Executive",
    "hours": 6,
    "passengers": 5,
    "luggage": 5,
    "includeCongestion": false
  }' 2>/dev/null | jq '{
    vehicle: .quote.vehicle_type,
    requested_hours: 6,
    actual_hours: .quote.hours,
    minimum_hours: .quote.minimum_hours,
    hourly_rate: .quote.pricing.hourly_rate,
    total: .quote.pricing.total_amount
  }'

echo ""
echo "===================================="
echo "✅ All disposal quote tests complete!"
echo ""
echo "To test locally, run:"
echo "  API_URL=http://localhost:3000 ./test-disposal-quotes.sh"

