# 🚀 MCP-Based Automated Job Quoting System - Complete Implementation Plan

## 📋 Executive Summary

This plan integrates an MCP (Model Context Protocol) server system into your existing JT Chauffeur Services platform to enable **real-time automated quote generation** with distance calculation, zone-based charges, and intelligent pricing.

**Current System**: Manual pricing team receives enquiries via WhatsApp → manually calculates quotes → sends back to customer

**New System**: AI automatically calculates quotes in real-time → instant customer response → optional manual override

---

## 🎯 System Architecture Overview

### Integration Strategy: **Hybrid Approach** (Recommended)
- Keep existing Redis-based enquiry system (proven, working)
- Add MCP pricing engine as a **microservice**
- Automatic quotes with manual override capability
- Gradual migration path

### Technology Stack Addition
```
Current Stack:
├── Backend: Node.js + Express + Upstash Redis
├── AI: OpenRouter (Claude 3.5 Sonnet)
├── WhatsApp: Green API
└── Search: Upstash Search + Vector

NEW MCP Layer:
├── Custom MCP Server (Pricing Engine)
├── Google Maps API (Distance/Duration)
├── PostgreSQL (Quote History & Analytics)
└── PDF Generation (Quote Documents)
```

---

## 📦 PART 1: REQUIREMENTS CHECKLIST

### ✅ What YOU Need to Set Up (Before I Start Building)

#### 1. **Google Maps API** (CRITICAL - Required for distance calculation)
- [ ] Go to: https://console.cloud.google.com/
- [ ] Create new project: "JT-Chauffeur-Pricing"
- [ ] Enable APIs:
  - [ ] **Distance Matrix API** (for distance/duration)
  - [ ] **Geocoding API** (for address validation)
  - [ ] **Places API** (for autocomplete - optional)
- [ ] Create API Key with restrictions:
  - [ ] API restrictions: Only Distance Matrix + Geocoding
  - [ ] Application restrictions: None (or your server IP)
- [ ] **Copy API Key** → Save for .env file
- [ ] **Estimated Cost**: ~$5-20/month (first $200/month free credit)

**Documentation**: https://developers.google.com/maps/documentation/distance-matrix/start

---

#### 2. **PostgreSQL Database** (RECOMMENDED - For quote analytics)

**Option A: Supabase (Recommended - Free tier available)**
- [ ] Go to: https://supabase.com/
- [ ] Create account + new project: "jt-chauffeur-quotes"
- [ ] Wait for database provisioning (~2 mins)
- [ ] Go to Settings → Database → Connection String
- [ ] Copy **Connection Pooling** string (URI mode)
- [ ] Format: `postgresql://postgres:[password]@[host]:6543/postgres`
- [ ] **Cost**: FREE (up to 500MB, 2GB bandwidth)

**Option B: Railway.app**
- [ ] Go to: https://railway.app/
- [ ] Create PostgreSQL database
- [ ] Copy connection string
- [ ] **Cost**: $5/month

**Option C: Local PostgreSQL** (Development only)
- [ ] Install: `brew install postgresql` (Mac) or download from postgresql.org
- [ ] Start: `brew services start postgresql`
- [ ] Connection: `postgresql://localhost:5432/jt_chauffeur`

---

#### 3. **PDF Generation Service** (OPTIONAL - Phase 2)

**Option A: PDFMonkey (Easiest)**
- [ ] Go to: https://www.pdfmonkey.io/
- [ ] Create account (free tier: 100 PDFs/month)
- [ ] Create template for quotes
- [ ] Copy API key
- [ ] **Cost**: FREE tier or $29/month

**Option B: Puppeteer (Self-hosted - Free)**
- No setup needed - I'll build this into the MCP server
- **Cost**: FREE

---

#### 4. **Email Service** (OPTIONAL - Phase 2)

**Option A: Resend (Recommended - Modern, simple)**
- [ ] Go to: https://resend.com/
- [ ] Create account
- [ ] Verify domain (or use resend.dev for testing)
- [ ] Create API key
- [ ] **Cost**: FREE (100 emails/day) or $20/month (unlimited)

**Option B: Use existing Gmail/WhatsApp**
- No setup needed - we'll use your existing WhatsApp integration

---

#### 5. **Zone Data** (I'll provide this - No action needed)
- London Congestion Charge Zone coordinates
- ULEZ Zone coordinates
- Airport zones
- Premium area multipliers

---

### 📝 Environment Variables You'll Need to Add

After setting up the above services, add these to your `.env` file:

```bash
# Google Maps API
GOOGLE_MAPS_API_KEY=AIzaSy...your-key-here

# PostgreSQL (Supabase or other)
POSTGRES_CONNECTION_STRING=postgresql://postgres:password@host:6543/postgres

# PDF Generation (Optional - Phase 2)
PDF_SERVICE=puppeteer  # or 'pdfmonkey'
PDFMONKEY_API_KEY=your-key-here  # if using PDFMonkey

# Email Service (Optional - Phase 2)
EMAIL_SERVICE=whatsapp  # or 'resend' or 'gmail'
RESEND_API_KEY=re_...your-key-here  # if using Resend

# Pricing Configuration
PRICING_MODE=auto  # 'auto' or 'manual' or 'hybrid'
AUTO_QUOTE_THRESHOLD=500  # Auto-approve quotes under £500
CONGESTION_CHARGE=15.00
ULEZ_CHARGE=12.50
```

---

## 🏗️ PART 2: IMPLEMENTATION PHASES

### **Phase 1: Core Pricing Engine** (Week 1)
**What I'll Build:**
1. Custom MCP server with pricing logic
2. Google Maps integration for distance/duration
3. Zone detection (Congestion/ULEZ)
4. Time-based multipliers (peak/off-peak/weekend)
5. Vehicle tier pricing rules
6. Integration with existing enquiry system

**Deliverables:**
- `mcp-pricing-server/` - Standalone MCP server
- Updated enquiry controller with auto-pricing
- Pricing rules management API
- Admin UI for pricing configuration

**Testing:**
- Unit tests for pricing calculations
- Integration tests with Google Maps
- End-to-end quote generation test

---

### **Phase 2: Database & Analytics** (Week 2)
**What I'll Build:**
1. PostgreSQL schema setup
2. Quote history storage
3. Analytics dashboard
4. Pricing optimization insights
5. A/B testing framework for pricing

**Deliverables:**
- Database migration scripts
- Analytics API endpoints
- Admin dashboard with charts
- Quote acceptance rate tracking

---

### **Phase 3: Automation & Documents** (Week 3)
**What I'll Build:**
1. PDF quote generation
2. Email automation
3. Booking confirmation workflow
4. Payment tracking integration
5. Driver assignment automation

**Deliverables:**
- PDF templates for quotes/invoices
- Email templates
- Automated booking pipeline
- Driver notification system

---

### **Phase 4: Claude Desktop Integration** (Week 4)
**What I'll Build:**
1. MCP server configuration for Claude Desktop
2. Natural language quote generation
3. Conversational booking flow
4. Multi-turn dialogue handling
5. Context-aware pricing adjustments

**Deliverables:**
- Claude Desktop config
- Conversation templates
- Training documentation
- Customer interaction scripts

---

## 🔄 PART 3: INTEGRATION APPROACH

### How It Works with Your Current System

#### Current Flow:
```
Customer WhatsApp → AI extracts info → Creates Enquiry (pending_quote)
→ Notifies Pricing Team → Manual quote → Updates Enquiry (quoted)
→ Sends to Customer
```

#### New Hybrid Flow:
```
Customer WhatsApp → AI extracts info → Creates Enquiry
→ MCP Pricing Engine calculates quote automatically
→ IF quote < £500: Auto-send to customer (quoted)
→ IF quote >= £500: Send to pricing team for review (pending_review)
→ Pricing team can approve/modify → Send to customer
```

### Backward Compatibility
- ✅ All existing enquiries remain unchanged
- ✅ Manual pricing still available
- ✅ Pricing team can override any auto-quote
- ✅ No breaking changes to current API
- ✅ Gradual rollout with feature flags

---

## 💰 PART 4: PRICING LOGIC SPECIFICATION

### Base Pricing Formula
```javascript
Total Quote = (Base Fare + Distance Charge + Zone Charges) × Time Multiplier + Additional Fees

Where:
- Base Fare = Vehicle tier base rate (e.g., £50 for Executive)
- Distance Charge = Distance (km) × Per-km rate (e.g., £2.50/km)
- Zone Charges = Congestion (£15) + ULEZ (£12.50) if applicable
- Time Multiplier = Peak (1.3x) | Standard (1.0x) | Off-peak (0.9x)
- Additional Fees = Meet & Greet (£25), Child seat (£15), etc.
```

### Vehicle Tiers & Pricing
```javascript
{
  "standard_saloon": {
    "name": "Standard Saloon",
    "baseFare": 40,
    "perKmRate": 2.00,
    "passengers": 4,
    "luggage": 2
  },
  "executive_sedan": {
    "name": "Executive Sedan",
    "baseFare": 60,
    "perKmRate": 2.50,
    "passengers": 4,
    "luggage": 3
  },
  "luxury_sedan": {
    "name": "Luxury Sedan",
    "baseFare": 90,
    "perKmRate": 3.50,
    "passengers": 4,
    "luggage": 3
  }
}
```

---


