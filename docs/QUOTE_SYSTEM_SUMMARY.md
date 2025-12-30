# Quote Submission System - Complete Guide

## Overview

The JT Chauffeur quote system supports **two methods** for submitting quotes to customers:

1. **WhatsApp** - Pricing team replies directly to enquiry notifications
2. **Admin Dashboard** - Manual quote submission via web interface

---

## Complete Workflow

### Step 1: Customer Submits Enquiry

Customers can submit booking enquiries through:
- **Website Form**: https://jesus-travel.site/test.html
- **WhatsApp**: Direct message to business WhatsApp number

### Step 2: System Creates Enquiry

The system automatically:
- Saves enquiry to database with unique reference (e.g., JT-2025-000123)
- Sets status to `pending_quote`
- Sends confirmation to customer

### Step 3: Pricing Team Gets Notified

Pricing team receives a WhatsApp notification:

```
NEW BOOKING ENQUIRY

Ref: JT-2025-000123
Customer: John Smith
Phone: +447700123456
From: Heathrow Airport
To: Central London
Date: 2025-01-15 at 14:00
Passengers: 2
Vehicle: Saloon

━━━━━━━━━━━━━━━━━━━━
To submit a quote, reply:
QUOTE JT-2025-000123 £150

Or with notes:
QUOTE JT-2025-000123 £150 Includes meet & greet
```

### Step 4: Pricing Team Submits Quote

#### Option A: WhatsApp Reply

Simply reply to the notification message:

**Basic Quote:**
```
QUOTE JT-2025-000123 £150
```

**Quote with Notes:**
```
QUOTE JT-2025-000123 £150 Includes meet & greet and 30 mins waiting time
```

#### Option B: Admin Dashboard

1. Navigate to https://jesus-travel.site/admin-dashboard.html
2. Login with admin credentials
3. Locate the enquiry (status will show "Pending Quote")
4. Click the yellow **"Quote"** button
5. Complete the quote form:
   - **Price** (required)
   - **Breakdown** (optional)
   - **Notes** (optional)
   - **Valid Until** (default: 48 hours)
6. Click **"Send Quote"**

### Step 5: System Processes Quote

The system automatically:
- Updates enquiry status to `quoted`
- Records price, notes, and validity period
- Sends confirmation to pricing team
- **Sends quote to customer via WhatsApp**

### Step 6: Customer Receives Quote

Customer receives WhatsApp message:

```
QUOTE READY - JT-2025-000123

Dear John Smith,

Thank you for your enquiry. Here's your quote:

From: Heathrow Airport
To: Central London
Date: 2025-01-15 at 14:00
Vehicle: Saloon
Passengers: 2

Total Price: £150

Notes: Includes meet & greet and 30 mins waiting time

This quote is valid until 17 Jan 2025, 14:00

Reply "YES" to confirm your booking or contact us for any questions.
```

### Step 7: Customer Responds

- **Reply "YES"** - Booking confirmed automatically
- **Reply "NO"** - Booking cancelled
- **No reply** - Quote expires after 48 hours

---

## Technical Details

### WhatsApp Quote Format

```
QUOTE <reference-number> <price> [optional notes]
```

**Valid Examples:**
- `QUOTE JT-2025-000123 £150`
- `QUOTE JT-2025-000123 150` (pound symbol optional)
- `QUOTE JT-2025-000123 £150 Includes meet & greet`

### API Endpoint

```http
PUT /api/v1/enquiries/:id/quote
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "price": 150,
  "currency": "GBP",
  "breakdown": "Base fare: £120, Airport fee: £30",
  "notes": "Includes meet & greet",
  "validUntil": "2025-01-17T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enquiry": { ... },
    "message": "Quote sent successfully"
  }
}
```

---

## Configuration

### Required Environment Variables

```bash
# Pricing team WhatsApp number (must match exactly)
PRICING_TEAM_PHONE=+447700900001

# WhatsApp API credentials
GREEN_API_INSTANCE_ID=your-instance-id
GREEN_API_TOKEN=your-token
```

### Setting Up on Render

1. Login to Render dashboard
2. Select your backend service
3. Navigate to **Environment** tab
4. Add or update `PRICING_TEAM_PHONE` variable
5. Save changes (service will auto-redeploy)

---

## For Pricing Team

See **PRICING_TEAM_GUIDE.md** for:
- Detailed WhatsApp reply instructions
- Quote formatting examples
- Post-submission workflow
- Troubleshooting tips

---

## For Administrators

### Admin Dashboard Features

- View all enquiries with status filters
- Search by customer name, phone, or reference number
- Submit quotes via web interface
- Real-time status updates
- Quote history tracking

### Login Credentials

- **URL**: https://jesus-travel.site/admin-dashboard.html
- **Email**: admin@jesus-travel.com
- **Password**: JesusWayne6667

---

## Support

For technical issues:
- Check Render logs for errors
- Verify `PRICING_TEAM_PHONE` is configured correctly
- Ensure WhatsApp API credentials are valid
- Use admin dashboard as backup method

