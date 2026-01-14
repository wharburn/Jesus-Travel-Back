# 🚗 JESUS TRAVEL - Complete System Overview

## 📋 Executive Summary

**JESUS TRAVEL** is a premium chauffeur service website with an integrated intelligent booking system. The platform serves customers in **London and Portugal**, offering executive transfers, corporate services, bespoke tours, and private security transport.

---

## 🌐 Website Structure

### **Frontend Pages** (Static HTML + JavaScript)

#### **Main Website Pages:**

1. **`index.html`** - Homepage with hero section, services overview
2. **`transfers.html`** - Airport & point-to-point transfers
3. **`tours.html`** - Bespoke sightseeing tours
4. **`business-corporate.html`** - Corporate & business travel services
5. **`private-security.html`** - Executive protection & secure transport
6. **`booking.html`** - Main booking form with Google Places autocomplete

#### **Admin Pages:**

7. **`admin.html`** - Admin login portal
8. **`admin-dashboard.html`** - Full enquiry management dashboard
9. **`admin-settings.html`** - System settings & pricing configuration

#### **Supporting Pages:**

- `cookies-policy.html`, `disclaimer.html` - Legal pages
- `language-switcher.html` - Multi-language support (EN, ES, PT, FR, DE, IT, ZH, JA, AR)
- `quick-quote.html` - Quick quote calculator
- `logout.html` - Admin logout

---

## 🎨 Design & Branding

### **Color Scheme:**

- **Primary Gold:** `#CAA85D` (jt-gold)
- **Background:** Black (`#000`)
- **Text:** White with gray variations
- **Accent:** Gold borders and highlights

### **Typography:**

- **Headings:** Playfair Display (serif)
- **Body:** Inter (sans-serif)

### **Key Features:**

- ✅ Fully responsive (mobile-first design)
- ✅ Smooth scroll navigation
- ✅ Fixed header with logo
- ✅ Mobile hamburger menu
- ✅ Multi-language support (9 languages)
- ✅ Google Analytics & Tag Manager integration
- ✅ Cookie consent management

---

## 🔧 Backend System Architecture

### **Technology Stack:**

#### **Runtime & Framework:**

- Node.js 18+ with Express.js
- Hosted on **Render** (auto-scaling, zero-downtime)

#### **Database:**

- **Upstash Redis** - Primary data store (serverless, low-latency)
- **Upstash Vector DB** - AI embeddings for smart search

#### **AI & Communication:**

- **OpenRouter** - Claude 3.5 Sonnet for conversational AI
- **WhatsApp** - Green API for customer & pricing team messaging
- **Google Maps API** - Route calculation, distance/duration, autocomplete

#### **Pricing Engine:**

- Real-time quote calculation
- Zone-based pricing (airports, city centers)
- Time-based multipliers (peak hours, weekends, holidays)
- Vehicle type pricing rules

---

## 📊 System Workflow

### **1. Customer Journey (Web Booking):**

```
Customer visits booking.html
    ↓
Fills form with Google Places autocomplete
    ↓
Submits booking → POST /api/v1/enquiries
    ↓
Backend creates enquiry with reference number (JT-2026-XXXXXX)
    ↓
AI calculates instant quote (if auto-quote enabled)
    ↓
Pricing team receives WhatsApp notification
    ↓
Pricing team approves/modifies quote via WhatsApp
    ↓
Customer receives quote via WhatsApp/Email
    ↓
Customer confirms → Booking created
```

### **2. WhatsApp Booking Journey:**

```
Customer messages WhatsApp
    ↓
AI Assistant collects: pickup, dropoff, date, time, passengers, vehicle
    ↓
Creates enquiry automatically
    ↓
[Same flow as web booking]
```

---

## 🔌 API Endpoints

### **Base URL:**

- **Production:** `https://jesus-travel-back.onrender.com/api/v1`
- **Local:** `http://localhost:3000/api/v1`

### **Public Endpoints:**

- `POST /enquiries` - Create booking enquiry
- `GET /health` - Health check
- `POST /webhooks/whatsapp` - WhatsApp webhook

### **Admin Endpoints** (JWT Required):

- `POST /auth/login` - Admin authentication
- `GET /enquiries` - List all enquiries
- `GET /enquiries/:id` - Get enquiry details
- `PUT /enquiries/:id/quote` - Submit/update quote
- `PUT /enquiries/:id/accept` - Accept quote
- `PUT /enquiries/:id/reject` - Reject quote
- `GET /settings` - Get system settings
- `PUT /settings` - Update settings
- `GET /settings/maps-api-key` - Get Google Maps API key

---

## 💰 Pricing System

### **Components:**

1. **Base Fare** - Starting price per vehicle type
2. **Distance Charge** - Per kilometer rate
3. **Zone Charges** - Airport fees, congestion charges
4. **Time Multipliers** - Peak hours, weekends, holidays
5. **Add-ons** - Meet & Greet, child seats, boosters

### **Vehicle Types:**

- Executive Sedan (3 passengers, 2 bags)
- Luxury Sedan (2 passengers, 2 bags)
- MPV Executive (6 passengers, 6 bags)
- Luxury SUV (3 passengers, 3 bags)
- Minibus (8 passengers, 6 bags)

### **Pricing Modes:**

#### **Auto-Quote Mode:**

- AI calculates instant quote
- Sent directly to customer
- Pricing team can override

#### **Supervised Mode:**

- Pricing team reviews all quotes
- Manual approval required
- WhatsApp quick commands: `003 OK`, `003 85`, `003 85 +MG`

---

## 📱 WhatsApp Integration

### **Pricing Team Commands:**

```
003 OK              → Approve AI estimate
003 85              → Set price to £85
003 85 +MG          → £85 + Meet & Greet
003 85 +CS +BS      → £85 + Child Seat + Booster
QUOTE JT-2026-000003 £85  → Full format quote
```

### **Customer Commands:**

```
YES / CONFIRM       → Accept quote
NO / CANCEL         → Reject quote
HELP                → Get help message
```

---

## 🎯 Key Features

### **Booking System:**

- ✅ Google Places autocomplete (UK & Portugal)
- ✅ Real-time quote calculation
- ✅ AI-powered pricing engine
- ✅ Multi-channel booking (Web + WhatsApp)
- ✅ Automatic reference number generation
- ✅ Quote validity tracking (48 hours)

### **Admin Dashboard:**

- ✅ Real-time enquiry management
- ✅ Status filtering (Pending, Quoted, Confirmed, Completed)
- ✅ Quick quote submission
- ✅ Route visualization on Google Maps
- ✅ Pricing rule configuration
- ✅ WhatsApp integration status

### **Communication:**

- ✅ WhatsApp notifications to pricing team
- ✅ WhatsApp quotes to customers
- ✅ Email notifications (planned)
- ✅ SMS notifications (planned)

---

## 📂 File Structure

```
website_JT/
├── Frontend (Static HTML/JS)
│   ├── index.html, transfers.html, tours.html, etc.
│   ├── booking.html + booking.js (Main booking form)
│   ├── admin-dashboard.html + admin.js (Admin panel)
│   ├── script.js (Global navigation & language)
│   ├── translations.js (Multi-language support)
│   └── images/ (Fleet photos, logos, hero images)
│
└── backend/
    ├── server.js (Entry point)
    ├── src/
    │   ├── app.js (Express setup)
    │   ├── config/ (Redis, Vector DB)
    │   ├── controllers/ (Business logic)
    │   ├── models/ (Data models)
    │   ├── routes/ (API routes)
    │   ├── services/
    │   │   ├── whatsapp/ (Green API integration)
    │   │   ├── ai/ (OpenRouter integration)
    │   │   └── pricing/ (Quote calculation engine)
    │   ├── middleware/ (Auth, validation, errors)
    │   └── utils/ (Helpers, logger)
    └── docs/ (Comprehensive documentation)
```

---

**Last Updated:** 2026-01-14
**System Status:** ✅ Fully Operational
**Current Version:** Phase 1 Complete + Auto-Quote System
