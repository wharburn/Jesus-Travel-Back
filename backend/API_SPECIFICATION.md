# 🔌 JT Chauffeur Services - API Specification

## Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.jtchauffeur.com/api/v1
```

---

## 🔐 Authentication

### Admin Endpoints
All admin endpoints require JWT token in header:
```
Authorization: Bearer <jwt_token>
```

### Public Endpoints
No authentication required for customer-facing endpoints.

---

## 📋 API Endpoints

### **1. Health & Status**

#### `GET /health`
Check API health status

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-29T10:30:00Z",
  "uptime": 86400,
  "services": {
    "redis": "connected",
    "vector": "connected",
    "whatsapp": "connected"
  }
}
```

---

### **2. Authentication**

#### `POST /auth/login`
Admin login

**Request:**
```json
{
  "email": "admin@jtchauffeur.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@jtchauffeur.com",
      "role": "admin",
      "name": "Admin User"
    }
  }
}
```

#### `POST /auth/logout`
Admin logout (invalidate token)

---

### **3. Enquiries**

#### `POST /enquiries`
Create new customer enquiry

**Request:**
```json
{
  "customerName": "John Smith",
  "customerPhone": "+447700123456",
  "customerEmail": "john@example.com",
  "pickupLocation": "Heathrow Terminal 5",
  "dropoffLocation": "Park Lane Hotel, London",
  "pickupDate": "2025-01-15",
  "pickupTime": "14:00",
  "passengers": 2,
  "vehicleType": "Luxury Sedan",
  "specialRequests": "Child seat required",
  "source": "whatsapp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "referenceNumber": "JT-2025-001234",
    "status": "pending_quote",
    "createdAt": "2025-12-29T10:30:00Z"
  }
}
```

#### `GET /enquiries`
List all enquiries (Admin only)

**Query Parameters:**
- `status`: pending_quote | quoted | confirmed | cancelled
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by reference number or customer name

**Response:**
```json
{
  "success": true,
  "data": {
    "enquiries": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### `GET /enquiries/:id`
Get enquiry details

#### `PUT /enquiries/:id/quote`
Submit quote for enquiry (Pricing team only)

**Request:**
```json
{
  "price": 120.00,
  "currency": "GBP",
  "breakdown": {
    "basePrice": 100.00,
    "waitingTime": 10.00,
    "meetAndGreet": 10.00
  },
  "validUntil": "2025-12-31T23:59:59Z",
  "notes": "Price includes meet and greet service"
}
```

#### `PUT /enquiries/:id/accept`
Customer accepts quote (converts to booking)

#### `PUT /enquiries/:id/reject`
Customer rejects quote

---

### **4. Bookings**

#### `GET /bookings`
List all bookings (Admin only)

**Query Parameters:**
- `status`: assigned | driver_accepted | in_progress | completed | cancelled
- `dateFrom`: Start date (YYYY-MM-DD)
- `dateTo`: End date (YYYY-MM-DD)
- `driverId`: Filter by driver
- `page`: Page number
- `limit`: Items per page

#### `GET /bookings/:id`
Get booking details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "referenceNumber": "JT-2025-001234",
    "customer": {
      "name": "John Smith",
      "phone": "+447700123456",
      "email": "john@example.com"
    },
    "driver": {
      "id": "uuid",
      "name": "James Wilson",
      "phone": "+447700888999",
      "vehicle": {
        "make": "Mercedes-Benz",
        "model": "S-Class",
        "color": "Black",
        "licensePlate": "AB12 CDE"
      }
    },
    "pickup": {
      "location": "Heathrow Terminal 5",
      "dateTime": "2025-01-15T14:00:00Z"
    },
    "dropoff": {
      "location": "Park Lane Hotel, London"
    },
    "price": 120.00,
    "status": "driver_accepted",
    "createdAt": "2025-12-29T11:00:00Z"
  }
}
```

#### `PUT /bookings/:id/assign-driver`
Manually assign driver to booking (Admin only)

**Request:**
```json
{
  "driverId": "uuid"
}
```

#### `PUT /bookings/:id/status`
Update booking status

**Request:**
```json
{
  "status": "in_progress",
  "notes": "Driver has picked up passenger"
}
```

#### `DELETE /bookings/:id`
Cancel booking

---

### **5. Drivers**

#### `POST /drivers`
Register new driver (Admin only)

**Request:**
```json
{
  "fullName": "James Wilson",
  "phone": "+447700888999",
  "email": "james@example.com",
  "licenseNumber": "WILSO123456AB7CD",
  "dateOfBirth": "1985-05-15",
  "address": {
    "street": "123 High Street",
    "city": "London",
    "postcode": "SW1A 1AA"
  }
}
```

#### `GET /drivers`
List all drivers (Admin only)

**Query Parameters:**
- `status`: available | busy | offline
- `vehicleType`: Filter by vehicle type
- `search`: Search by name or phone

#### `GET /drivers/:id`
Get driver details

#### `PUT /drivers/:id`
Update driver profile

#### `PUT /drivers/:id/status`
Update driver availability status

**Request:**
```json
{
  "status": "available"
}
```

#### `GET /drivers/:id/bookings`
Get driver's booking history

#### `GET /drivers/available`
Find available drivers for a booking

**Query Parameters:**
- `pickupLocation`: Pickup location
- `vehicleType`: Required vehicle type
- `dateTime`: Pickup date and time

---

### **6. Vehicles**

#### `POST /vehicles`
Register new vehicle (Admin only)

**Request:**
```json
{
  "driverId": "uuid",
  "make": "Mercedes-Benz",
  "model": "S-Class",
  "year": 2023,
  "color": "Black",
  "licensePlate": "AB12 CDE",
  "vehicleType": "Luxury Sedan",
  "capacity": 4,
  "features": ["WiFi", "Water", "Phone Charger"],
  "insurance": {
    "provider": "Allianz",
    "policyNumber": "POL123456",
    "expiryDate": "2025-12-31"
  }
}
```

#### `GET /vehicles`
List all vehicles

#### `GET /vehicles/:id`
Get vehicle details

#### `PUT /vehicles/:id`
Update vehicle information

---

### **7. WhatsApp Webhook**

#### `POST /webhook/whatsapp`
Receive incoming WhatsApp messages from Green API

**Request (from Green API):**
```json
{
  "typeWebhook": "incomingMessageReceived",
  "instanceData": {
    "idInstance": "1234567890",
    "wid": "447700123456@c.us",
    "typeInstance": "whatsapp"
  },
  "messageData": {
    "typeMessage": "textMessage",
    "textMessageData": {
      "textMessage": "I need a ride from Heathrow tomorrow at 2pm"
    },
    "timestamp": 1640000000
  },
  "senderData": {
    "chatId": "447700123456@c.us",
    "sender": "447700123456@c.us",
    "senderName": "John Smith"
  }
}
```

---

### **8. Analytics**

#### `GET /analytics/revenue`
Get revenue statistics (Admin only)

**Query Parameters:**
- `period`: daily | weekly | monthly
- `dateFrom`: Start date
- `dateTo`: End date

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 15000.00,
    "bookingsCount": 125,
    "averageBookingValue": 120.00,
    "breakdown": [
      {
        "date": "2025-12-29",
        "revenue": 500.00,
        "bookings": 5
      }
    ]
  }
}
```

#### `GET /analytics/drivers`
Get driver performance metrics

#### `GET /analytics/popular-routes`
Get most popular routes

---

### **9. Uber Integration (Optional)**

#### `POST /uber/estimate`
Get Uber ride estimate

**Request:**
```json
{
  "pickupLatitude": 51.4700,
  "pickupLongitude": -0.4543,
  "dropoffLatitude": 51.5074,
  "dropoffLongitude": -0.1278
}
```

#### `POST /uber/request`
Request Uber ride on behalf of customer

---

## 🚨 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": {
      "field": "customerPhone",
      "value": "invalid"
    }
  }
}
```

### Error Codes
- `VALIDATION_ERROR` - Invalid input data
- `AUTHENTICATION_ERROR` - Invalid or missing token
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## 📊 Rate Limiting

- **Public endpoints**: 100 requests per 15 minutes per IP
- **Admin endpoints**: 1000 requests per 15 minutes per user
- **WhatsApp webhook**: No limit (trusted source)

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## 🔒 Security Headers

All responses include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

**API Version: 1.0.0**

