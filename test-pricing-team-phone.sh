#!/bin/bash

echo "🧪 Testing Pricing Team Phone Number"
echo "======================================"
echo ""

# Get JWT token
echo "1️⃣ Getting admin token..."
TOKEN=$(curl -s -X POST "https://jesus-travel-back.onrender.com/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jesus-travel.com","password":"JesusWayne6667"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

echo "✅ Token obtained"
echo ""

# Get current settings
echo "2️⃣ Checking current settings..."
SETTINGS=$(curl -s -X GET "https://jesus-travel-back.onrender.com/api/v1/settings" \
  -H "Authorization: Bearer $TOKEN")

PRICING_TEAM_PHONE=$(echo $SETTINGS | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['pricingTeam']['phone'])")

echo "📞 Pricing Team Phone in Redis: $PRICING_TEAM_PHONE"
echo ""

# Create test booking
echo "3️⃣ Creating test booking..."
BOOKING_RESPONSE=$(curl -s -X POST "https://jesus-travel-back.onrender.com/api/v1/enquiries" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerPhone": "+447700900123",
    "customerEmail": "test@example.com",
    "pickupLocation": "Heathrow Airport, London",
    "dropoffLocation": "London Bridge, London",
    "pickupDate": "2026-01-20",
    "pickupTime": "10:00",
    "passengers": 2,
    "vehicleType": "saloon",
    "specialRequests": "Test booking to verify pricing team phone"
  }')

REF_NUMBER=$(echo $BOOKING_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['referenceNumber'])" 2>/dev/null)

if [ -z "$REF_NUMBER" ]; then
  echo "❌ Failed to create booking"
  echo "$BOOKING_RESPONSE" | python3 -m json.tool
  exit 1
fi

echo "✅ Booking created: $REF_NUMBER"
echo ""

echo "======================================"
echo "✅ Test Complete!"
echo ""
echo "📱 Check WhatsApp on: $PRICING_TEAM_PHONE"
echo "📋 Reference: $REF_NUMBER"
echo ""
echo "If the message went to the WRONG number, check Render logs:"
echo "https://dashboard.render.com/"
echo ""

