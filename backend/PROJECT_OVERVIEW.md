# 🚗 JT Chauffeur Services - AI-Powered Booking System

## 📋 Project Overview

An intelligent, automated booking and dispatch system for JT Chauffeur Services that combines AI-powered customer interactions with efficient driver management and optional third-party ride integration.

---

## 🎯 Core Objectives

1. **Automate Customer Bookings** - AI-powered WhatsApp and web booking with natural language processing
2. **Streamline Driver Dispatch** - Intelligent assignment of bookings to available drivers
3. **Manual Pricing Control** - Team-based pricing approval workflow for custom quotes
4. **Admin Dashboard** - Centralized management of enquiries, bookings, drivers, and fleet
5. **Scalable Architecture** - Built for growth with optional Uber API integration

---

## 🏗️ System Architecture

### **Technology Stack**

#### **Backend**
- **Runtime**: Node.js 18+ with Express.js
- **Database**: Upstash Redis (serverless, low-latency)
- **Vector DB**: Upstash Vector (AI embeddings for smart search)
- **Hosting**: Render (auto-scaling, zero-downtime deployments)

#### **AI & Communication**
- **AI Brain**: OpenRouter (Claude 3.5 Sonnet for conversations)
- **Voice-to-Text**: Deepgram (WhatsApp voice messages)
- **Text-to-Voice**: ElevenLabs (voice responses)
- **WhatsApp**: Green API (customer & driver messaging)

#### **Frontend**
- **Customer Portal**: Existing website + booking widget
- **Admin Dashboard**: React/Vue.js (to be built)
- **Driver Interface**: WhatsApp bot (mobile app in future)

#### **Optional Integrations**
- **Uber API**: Fallback ride requests (switchable)
- **Payment Gateway**: Stripe/PayPal (future phase)

---

## 🔄 System Workflow

### **1. Customer Booking Journey**

```
Customer → WhatsApp/Web Form → AI Assistant
                                    ↓
                        Collects: Pickup, Dropoff, Date, Time, 
                                 Passengers, Vehicle Type, Special Requests
                                    ↓
                        Creates Enquiry → Sends to Pricing Team
                                    ↓
                        Pricing Team Reviews → Approves Price
                                    ↓
                        Quote Sent to Customer → Customer Confirms
                                    ↓
                        Booking Created → Driver Assignment
                                    ↓
                        Driver Accepts → Customer Notified
                                    ↓
                        Journey Completed → Payment & Feedback
```

### **2. Driver Dispatch Workflow**

```
New Booking Created
        ↓
Find Available Drivers (location, vehicle type, schedule)
        ↓
    ┌───────────────┴───────────────┐
    ↓                               ↓
Internal Driver Available      No Driver Available
    ↓                               ↓
Assign to Driver            Add to Waiting List
    ↓                               ↓
WhatsApp Notification      Optional: Generate Uber Link
    ↓                               ↓
Driver Accepts/Declines    Notify Customer of Options
    ↓
Customer Notified with Driver Details
```

### **3. Admin Management Flow**

```
Admin Dashboard
    ↓
├── Enquiries Tab (pending quotes)
├── Bookings Tab (confirmed rides)
├── Drivers Tab (fleet management)
├── Pricing Tab (manual approvals)
└── Analytics Tab (revenue, performance)
```

---

## 📊 Data Models

### **Customer Enquiry**
```javascript
{
  id: "uuid",
  referenceNumber: "JT-2025-001234",
  customerName: "John Smith",
  customerPhone: "+447700123456",
  customerEmail: "john@example.com",
  pickupLocation: "Heathrow Terminal 5",
  dropoffLocation: "Park Lane Hotel, London",
  pickupDate: "2025-01-15",
  pickupTime: "14:00",
  passengers: 2,
  vehicleType: "Luxury Sedan",
  specialRequests: "Child seat required",
  status: "pending_quote", // pending_quote, quoted, confirmed, completed, cancelled
  quotedPrice: null,
  quotedBy: null,
  quotedAt: null,
  createdAt: "2025-12-29T10:30:00Z"
}
```

### **Confirmed Booking**
```javascript
{
  id: "uuid",
  enquiryId: "uuid",
  referenceNumber: "JT-2025-001234",
  customerId: "uuid",
  driverId: "uuid",
  vehicleId: "uuid",
  pickupLocation: {...},
  dropoffLocation: {...},
  scheduledDateTime: "2025-01-15T14:00:00Z",
  estimatedDuration: 45, // minutes
  quotedPrice: 120.00,
  actualPrice: null,
  status: "assigned", // assigned, driver_accepted, in_progress, completed, cancelled
  paymentStatus: "pending", // pending, paid, refunded
  driverNotes: "",
  customerNotes: "",
  createdAt: "2025-12-29T11:00:00Z",
  completedAt: null
}
```

### **Driver Profile**
```javascript
{
  id: "uuid",
  fullName: "James Wilson",
  phone: "+447700888999",
  email: "james@example.com",
  licenseNumber: "WILSO123456AB7CD",
  vehicleId: "uuid",
  status: "available", // available, busy, offline
  currentLocation: {
    latitude: 51.5074,
    longitude: -0.1278,
    lastUpdated: "2025-12-29T10:30:00Z"
  },
  rating: 4.8,
  totalTrips: 156,
  verified: true,
  joinedDate: "2024-01-15"
}
```

### **Vehicle**
```javascript
{
  id: "uuid",
  driverId: "uuid",
  make: "Mercedes-Benz",
  model: "S-Class",
  year: 2023,
  color: "Black",
  licensePlate: "AB12 CDE",
  vehicleType: "Luxury Sedan", // Saloon, Sedan, SUV, MPV, Minibus
  capacity: 4,
  features: ["WiFi", "Water", "Phone Charger", "Child Seat"],
  insurance: {
    provider: "Allianz",
    policyNumber: "POL123456",
    expiryDate: "2025-12-31"
  }
}
```

---

## 🤖 AI Assistant Capabilities

### **Natural Language Understanding**
- Extracts booking details from conversational messages
- Handles multiple languages (English, Spanish, French, etc.)
- Understands context and follow-up questions
- Clarifies ambiguous requests

### **Voice Message Support**
- Transcribes WhatsApp voice messages via Deepgram
- Responds with voice messages via ElevenLabs
- Maintains conversation context across voice/text

### **Smart Features**
- **Location Recognition**: "Heathrow" → "Heathrow Airport, London"
- **Date Parsing**: "tomorrow at 3pm" → "2025-12-30 15:00"
- **Vehicle Suggestions**: "4 passengers with luggage" → "SUV recommended"
- **Price Estimation**: Provides rough estimates before official quote

---

## 📱 WhatsApp Integration

### **Customer Commands**
```
"Book a ride from Heathrow to London"
"I need a car for tomorrow at 2pm"
"Quote for airport transfer"
"Track my booking JT-2025-001234"
"Cancel booking"
```

### **Driver Commands**
```
ONLINE - Go available for bookings
OFFLINE - Stop receiving assignments
JOBS - View pending assignments
ACCEPT [REF] - Accept a booking
DECLINE [REF] - Decline a booking
ARRIVED - Mark as arrived at pickup
STARTED - Begin journey
COMPLETED [REF] - Mark journey complete
LOCATION - Update current location
```

---

## 🎛️ Admin Dashboard Features

### **Enquiries Management**
- View all pending quote requests
- Assign pricing team member
- Enter custom quote with breakdown
- Send quote to customer via WhatsApp
- Track quote acceptance rate

### **Bookings Management**
- Real-time booking status
- Manual driver assignment override
- View driver location on map
- Customer communication history
- Booking modifications and cancellations

### **Driver Management**
- Driver profiles and documents
- Real-time availability status
- Performance metrics (rating, completion rate)
- Assign/unassign vehicles
- Broadcast messages to all drivers

### **Fleet Management**
- Vehicle inventory
- Maintenance schedules
- Insurance/MOT expiry alerts
- Vehicle utilization reports

### **Analytics Dashboard**
- Daily/weekly/monthly revenue
- Booking conversion rate
- Driver performance leaderboard
- Popular routes and times
- Customer satisfaction scores

---

## 🔌 Uber API Integration (Optional)

### **When to Use**
- No internal drivers available
- Customer requests Uber specifically
- Overflow during peak times
- Admin manually enables for specific booking

### **Capabilities**
- Get ride estimates (price & ETA)
- Request rides on behalf of customers
- Track ride status
- Retrieve trip details

### **Configuration**
- Switchable via admin dashboard
- Per-booking or global setting
- Fallback priority: Internal → Uber → Manual

---

## 🔐 Security & Compliance

### **Data Protection**
- All customer data encrypted at rest
- HTTPS/TLS for all communications
- GDPR-compliant data handling
- Regular automated backups

### **Authentication**
- JWT-based admin authentication
- Role-based access control (Admin, Pricing Team, Driver)
- API rate limiting
- Request validation and sanitization

### **Payment Security**
- PCI-DSS compliant (when payment gateway added)
- No credit card storage on servers
- Secure payment links via Stripe

---

## 📈 Future Enhancements

### **Phase 2 (Q2 2025)**
- Dedicated driver mobile app (iOS/Android)
- Real-time GPS tracking
- In-app payments
- Customer loyalty program

### **Phase 3 (Q3 2025)**
- Multi-language support expansion
- Corporate account management
- Recurring booking templates
- Advanced analytics and reporting

### **Phase 4 (Q4 2025)**
- Integration with flight tracking APIs
- Dynamic pricing based on demand
- Customer mobile app
- Referral program

---

## 🚀 Deployment Strategy

### **Development Environment**
- Local development with Docker
- Upstash Redis free tier
- Test WhatsApp instance

### **Staging Environment**
- Render staging deployment
- Separate Upstash database
- Limited AI credits for testing

### **Production Environment**
- Render production with auto-scaling
- Upstash Redis production tier
- Full monitoring and logging
- Automated backups

---

## 📞 Support & Maintenance

### **Monitoring**
- Uptime monitoring (UptimeRobot)
- Error tracking (Sentry)
- Performance metrics (New Relic)
- WhatsApp delivery status

### **Backup Strategy**
- Daily automated Redis backups
- Weekly full system snapshots
- 30-day retention policy

### **Update Schedule**
- Security patches: Immediate
- Feature updates: Bi-weekly
- Major releases: Monthly

---

## 👥 Team Roles

### **Development Team**
- Backend Developer (Node.js/Redis)
- Frontend Developer (React/Admin Dashboard)
- AI/ML Engineer (OpenRouter integration)
- DevOps Engineer (Render deployment)

### **Operations Team**
- Pricing Team (quote approvals)
- Customer Support (escalations)
- Driver Manager (onboarding, support)
- Admin (system oversight)

---

## 📊 Success Metrics

### **Key Performance Indicators (KPIs)**
- **Booking Conversion Rate**: >70%
- **Average Response Time**: <2 minutes
- **Driver Acceptance Rate**: >85%
- **Customer Satisfaction**: >4.5/5
- **System Uptime**: >99.5%

---

**Built with ❤️ for JT Chauffeur Services**

