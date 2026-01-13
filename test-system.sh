#!/bin/bash

echo "======================================"
echo "  JT CHAUFFEUR SYSTEM TEST SUITE"
echo "======================================"
echo ""

# Test 1: Health Check
echo "✓ Test 1: Health Check"
curl -s http://localhost:3000/api/v1/health | jq .
echo ""

# Test 2: Heathrow to Central London (Peak Morning)
echo "✓ Test 2: Heathrow → Central London (Peak Morning)"
echo "   Expected: Airport zone + ULEZ + Peak multiplier"
curl -s -X POST http://localhost:3000/api/v1/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress":"Heathrow Airport, London",
    "dropoffAddress":"Piccadilly Circus, London",
    "pickupDatetime":"2026-01-15T08:30:00Z",
    "vehicleType":"Executive Sedan",
    "passengers":2,
    "luggage":2
  }' | jq '{
    total: .quote.pricing.total_amount,
    zone_charges: .quote.pricing.zone_charges,
    zones: .quote.pricing.zone_breakdown,
    time_multiplier: .quote.pricing.time_multiplier_name
  }'
echo ""

# Test 3: Gatwick to Central London (Standard Daytime)
echo "✓ Test 3: Gatwick → Central London (Standard Daytime)"
echo "   Expected: Airport zone + Congestion + ULEZ"
curl -s -X POST http://localhost:3000/api/v1/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress":"Gatwick Airport",
    "dropoffAddress":"Trafalgar Square, London",
    "pickupDatetime":"2026-01-15T14:30:00Z",
    "vehicleType":"Luxury MPV",
    "passengers":4,
    "luggage":4
  }' | jq '{
    total: .quote.pricing.total_amount,
    zone_charges: .quote.pricing.zone_charges,
    zones: .quote.pricing.zone_breakdown,
    time_multiplier: .quote.pricing.time_multiplier_name
  }'
echo ""

# Test 4: Central London to Canary Wharf (Evening)
echo "✓ Test 4: Mayfair → Canary Wharf (Evening)"
echo "   Expected: Congestion + ULEZ zones"
curl -s -X POST http://localhost:3000/api/v1/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress":"Mayfair, London",
    "dropoffAddress":"Canary Wharf, London",
    "pickupDatetime":"2026-01-15T19:00:00Z",
    "vehicleType":"Standard Sedan",
    "passengers":1,
    "luggage":1
  }' | jq '{
    total: .quote.pricing.total_amount,
    zone_charges: .quote.pricing.zone_charges,
    zones: .quote.pricing.zone_breakdown,
    time_multiplier: .quote.pricing.time_multiplier_name
  }'
echo ""

# Test 5: Long Distance (Late Night)
echo "✓ Test 5: London → Oxford (Late Night)"
echo "   Expected: No zones, Late Night multiplier"
curl -s -X POST http://localhost:3000/api/v1/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress":"London",
    "dropoffAddress":"Oxford",
    "pickupDatetime":"2026-01-15T23:30:00Z",
    "vehicleType":"Executive MPV",
    "passengers":3,
    "luggage":3
  }' | jq '{
    total: .quote.pricing.total_amount,
    zone_charges: .quote.pricing.zone_charges,
    zones: .quote.pricing.zone_breakdown,
    time_multiplier: .quote.pricing.time_multiplier_name
  }'
echo ""

# Test 6: Create an enquiry
echo "✓ Test 6: Create Enquiry"
ENQUIRY_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/enquiries \
  -H "Content-Type: application/json" \
  -d '{
    "customerName":"John Smith",
    "customerEmail":"john.smith@example.com",
    "customerPhone":"+447700900123",
    "pickupLocation":"Heathrow Airport, London",
    "dropoffLocation":"10 Downing Street, London",
    "pickupDate":"2026-01-20",
    "pickupTime":"10:00",
    "vehicleType":"Executive Sedan",
    "passengers":2,
    "specialRequests":"Meet and greet service"
  }')

echo "$ENQUIRY_RESPONSE" | jq '{
  success: .success,
  enquiry_id: .data.id,
  reference: .data.referenceNumber,
  status: .data.status
}'

ENQUIRY_ID=$(echo "$ENQUIRY_RESPONSE" | jq -r '.data.id')
echo ""

# Test 7: Retrieve the enquiry
if [ "$ENQUIRY_ID" != "null" ] && [ -n "$ENQUIRY_ID" ]; then
  echo "✓ Test 7: Retrieve Enquiry (ID: $ENQUIRY_ID)"
  curl -s "http://localhost:3000/api/v1/enquiries/$ENQUIRY_ID" | jq '{
    success: .success,
    enquiry_id: .data.id,
    customer_name: .data.customerName,
    reference: .data.referenceNumber,
    status: .data.status
  }'
else
  echo "✗ Test 7: Skipped (no enquiry ID)"
fi

echo ""
echo "======================================"
echo "  ALL TESTS COMPLETE"
echo "======================================"

