#!/bin/bash

echo "🧪 Testing MCP Quote System"
echo "=============================="
echo ""

# Test 1: Heathrow to Central London (Executive Sedan)
echo "Test 1: Heathrow → Central London (Executive Sedan)"
curl -X POST http://localhost:3000/api/v1/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress":"Heathrow Airport",
    "dropoffAddress":"Central London",
    "pickupDatetime":"2026-01-15T14:30:00Z",
    "vehicleType":"Executive Sedan"
  }' 2>/dev/null | jq '.quote.pricing'

echo ""
echo "---"
echo ""

# Test 2: Gatwick to Central London (Luxury MPV)
echo "Test 2: Gatwick → Central London (Luxury MPV)"
curl -X POST http://localhost:3000/api/v1/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress":"Gatwick Airport",
    "dropoffAddress":"Piccadilly Circus, London",
    "pickupDatetime":"2026-01-15T08:00:00Z",
    "vehicleType":"Luxury MPV"
  }' 2>/dev/null | jq '.quote.pricing'

echo ""
echo "---"
echo ""

# Test 3: Short city journey (Standard Sedan)
echo "Test 3: Mayfair → Canary Wharf (Standard Sedan)"
curl -X POST http://localhost:3000/api/v1/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress":"Mayfair, London",
    "dropoffAddress":"Canary Wharf, London",
    "pickupDatetime":"2026-01-15T18:00:00Z",
    "vehicleType":"Standard Sedan"
  }' 2>/dev/null | jq '.quote.pricing'

echo ""
echo "---"
echo ""

# Test 4: Long distance (Executive MPV)
echo "Test 4: London → Oxford (Executive MPV)"
curl -X POST http://localhost:3000/api/v1/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress":"London",
    "dropoffAddress":"Oxford",
    "pickupDatetime":"2026-01-15T10:00:00Z",
    "vehicleType":"Executive MPV"
  }' 2>/dev/null | jq '.quote.pricing'

echo ""
echo "=============================="
echo "✅ All tests complete!"

