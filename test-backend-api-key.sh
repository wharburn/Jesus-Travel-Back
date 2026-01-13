#!/bin/bash

echo "🧪 Testing Backend Google Maps API Key Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Submit a test enquiry and check if AI estimate is calculated
echo "📤 Test 1: Submitting test enquiry to backend..."
echo ""

RESPONSE=$(curl -s -X POST https://jesus-travel-back.onrender.com/api/v1/enquiries \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "customerPhone": "+447700900000",
    "pickupLocation": "London Heathrow Airport, Longford TW6, UK",
    "dropoffLocation": "London Gatwick Airport, Horley RH6 0NP, UK",
    "pickupDate": "2026-01-20",
    "pickupTime": "10:00",
    "passengers": 2,
    "vehicleType": "Standard Sedan",
    "specialRequests": "Test booking to check AI estimate",
    "source": "test"
  }')

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if AI estimate is present
AI_ESTIMATE=$(echo "$RESPONSE" | jq -r '.data.aiEstimate // "null"' 2>/dev/null)

if [ "$AI_ESTIMATE" != "null" ] && [ "$AI_ESTIMATE" != "" ]; then
  echo "✅ SUCCESS: AI Estimate is working!"
  echo ""
  echo "AI Estimate Details:"
  echo "$RESPONSE" | jq '.data.aiEstimate' 2>/dev/null
  echo ""
  echo "🎉 The Google Maps API key is configured correctly on Render!"
else
  echo "❌ FAILED: AI Estimate is NOT available"
  echo ""
  echo "This means the GOOGLE_MAPS_API_KEY on Render is either:"
  echo "  1. Not set"
  echo "  2. Set to the wrong value"
  echo "  3. Invalid or restricted"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🔧 TO FIX:"
  echo ""
  echo "1. Go to https://dashboard.render.com/"
  echo "2. Select your backend service"
  echo "3. Click 'Environment' tab"
  echo "4. Find GOOGLE_MAPS_API_KEY"
  echo "5. Update to: AIzaSyDtkzW3zbExrKKowMYZy83pQp9I5fciM2Y"
  echo "6. Click 'Save Changes'"
  echo "7. Wait for redeployment (2-5 minutes)"
  echo "8. Run this test again"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

