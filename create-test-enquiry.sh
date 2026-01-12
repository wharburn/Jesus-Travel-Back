#!/bin/bash

curl -X POST http://localhost:3000/api/v1/enquiries \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Jesus Rui",
    "customerEmail": "jesus@example.com",
    "customerPhone": "+447822027794",
    "pickupLocation": "London Heathrow Airport Terminal 5",
    "dropoffLocation": "Central London Hotel",
    "pickupDate": "2026-02-25",
    "pickupTime": "15:00",
    "passengers": 2,
    "vehicleType": "executive_sedan",
    "specialRequests": "Need meet and greet service at arrivals",
    "source": "web"
  }'

echo ""
echo "Enquiry created! Check the admin dashboard."

