#!/bin/bash

# Test script to verify At Disposal AI estimate calculation
# This tests creating an enquiry with disposal booking type

API_URL="https://jesus-travel-back.onrender.com"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing At Disposal AI Estimate Calculation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test: MPV Executive - 10 hours with congestion
echo "📋 Test: MPV Executive - 10 hours At Disposal with congestion"
echo "Expected: 10 hours × £60/hr + £15 congestion = £615"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/v1/enquiries" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerPhone": "+447700900123",
    "customerEmail": "test@example.com",
    "pickupLocation": "Heathrow Terminal 4, London",
    "dropoffLocation": "",
    "pickupDate": "2026-01-22",
    "pickupTime": "10:00",
    "passengers": 5,
    "vehicleType": "MPV Executive",
    "bookingType": "disposal",
    "hours": 10,
    "includeCongestion": true,
    "specialRequests": "Test disposal booking",
    "source": "test"
  }')

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Extract AI estimate
AI_ESTIMATE=$(echo "$RESPONSE" | jq -r '.data.aiEstimate.totalPrice // "null"')
BOOKING_TYPE=$(echo "$RESPONSE" | jq -r '.data.aiEstimate.bookingType // "null"')
HOURS=$(echo "$RESPONSE" | jq -r '.data.aiEstimate.hours // "null"')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Results:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$AI_ESTIMATE" != "null" ] && [ "$AI_ESTIMATE" != "" ]; then
  echo "✅ AI Estimate: £$AI_ESTIMATE"
  echo "✅ Booking Type: $BOOKING_TYPE"
  echo "✅ Hours: $HOURS"
  echo ""
  
  if [ "$BOOKING_TYPE" = "disposal" ]; then
    echo "✅ SUCCESS: Disposal booking type detected correctly!"
  else
    echo "❌ FAILED: Booking type should be 'disposal' but got '$BOOKING_TYPE'"
  fi
  
  if [ "$HOURS" = "10" ]; then
    echo "✅ SUCCESS: Hours calculated correctly!"
  else
    echo "❌ FAILED: Hours should be 10 but got '$HOURS'"
  fi
  
  # Check if price is reasonable (should be around £615)
  if (( $(echo "$AI_ESTIMATE > 600 && $AI_ESTIMATE < 650" | bc -l) )); then
    echo "✅ SUCCESS: Price is in expected range (£600-£650)"
  else
    echo "⚠️  WARNING: Price £$AI_ESTIMATE is outside expected range (£600-£650)"
  fi
else
  echo "❌ FAILED: No AI estimate returned"
  echo ""
  echo "This could mean:"
  echo "  1. Google Maps API key not configured"
  echo "  2. Disposal quote calculation failed"
  echo "  3. Backend error"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

