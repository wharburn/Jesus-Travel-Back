# 🎯 Quote Submission System - Complete Guide

## 📋 Overview

The system now supports **TWO ways** to submit quotes to customers:

1. **WhatsApp** - Pricing team replies directly to enquiry notifications
2. **Admin Dashboard** - Manual quote submission via web interface

## 🔄 Complete Workflow

### 1️⃣ Customer Submits Enquiry
- **Via Website**: Customer fills form at https://jesus-travel.site/test.html
- **Via WhatsApp**: Customer messages the business WhatsApp number

### 2️⃣ System Creates Enquiry
- Enquiry saved to database with unique reference (e.g., JT-2025-000123)
- Status set to `pending_quote`
- Customer receives confirmation

### 3️⃣ Pricing Team Gets Notified
Pricing team receives WhatsApp message:
```
🆕 New Booking Enquiry

Ref: JT-2025-000123
Customer: John Smith
Phone: +447700123456
From: Heathrow Airport
To: Central London
Date: 2025-01-15 at 14:00
Passengers: 2
Vehicle: Saloon

━━━━━━━━━━━━━━━━━━━━
📝 To submit a quote, reply:
QUOTE JT-2025-000123 £150

Or with notes:
QUOTE JT-2025-000123 £150 Includes meet & greet
```

### 4️⃣ Pricing Team Submits Quote

#### Option A: WhatsApp Reply
Simply reply to the notification:
```
QUOTE JT-2025-000123 £150
```

Or with notes:
```
QUOTE JT-2025-000123 £150 Includes meet & greet and 30 mins waiting time
```

#### Option B: Admin Dashboard
1. Go to https://jesus-travel.site/admin-dashboard.html
2. Login with admin credentials
3. Find the enquiry (status: Pending Quote)
4. Click yellow "Quote" button
5. Fill in the form:
   - Price (required)
   - Breakdown (optional)
   - Notes (optional)
   - Valid Until (default: 48 hours)
6. Click "Send Quote"

### 5️⃣ System Processes Quote
- Updates enquiry status to `quoted`
- Records price, notes, and validity period
- Sends confirmation to pricing team
- **Automatically sends quote to customer via WhatsApp**

### 6️⃣ Customer Receives Quote
Customer gets WhatsApp message:
```
✅ Quote Ready - JT-2025-000123

Dear John Smith,

Thank you for your enquiry. Here's your quote:

📍 From: Heathrow Airport
📍 To: Central London
📅 Date: 2025-01-15 at 14:00
🚗 Vehicle: Saloon
👥 Passengers: 2

💰 Total Price: £150

📝 Notes: Includes meet & greet and 30 mins waiting time

This quote is valid until 17 Jan 2025, 14:00

Reply "YES" to confirm your booking or contact us for any questions.
```

### 7️⃣ Customer Responds
- **Reply "YES"** → Booking confirmed ✅
- **Reply "NO"** → Booking cancelled ❌
- **No reply** → Quote expires after 48 hours ⏰

## 🔧 Technical Details

### WhatsApp Quote Format
```
QUOTE <reference-number> <price> [optional notes]
```

**Examples:**
- `QUOTE JT-2025-000123 £150`
- `QUOTE JT-2025-000123 150` (£ symbol optional)
- `QUOTE JT-2025-000123 £150 Includes meet & greet`

### API Endpoint
```
PUT /api/v1/enquiries/:id/quote
Authorization: Bearer <admin-token>

Body:
{
  "price": 150,
  "currency": "GBP",
  "breakdown": "Base fare: £120, Airport fee: £30",
  "notes": "Includes meet & greet",
  "validUntil": "2025-01-17T14:00:00Z"
}
```

## ⚙️ Configuration

### Required Environment Variables
```bash
# Pricing team WhatsApp number (must match exactly)
PRICING_TEAM_PHONE=+447700900001

# WhatsApp API credentials
GREEN_API_INSTANCE_ID=your-instance-id
GREEN_API_TOKEN=your-token
```

### Setting Up on Render
1. Go to Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add/update `PRICING_TEAM_PHONE` with the correct number
5. Save changes (service will auto-redeploy)

## 📱 For Pricing Team

See **PRICING_TEAM_GUIDE.md** for detailed instructions on:
- How to format WhatsApp replies
- Examples of different quote types
- What happens after submitting a quote
- Troubleshooting

## 🎨 For Admins

### Admin Dashboard Features
- View all enquiries with filters (status, source)
- Search by customer name, phone, or reference
- Click "Quote" button on pending enquiries
- Fill quote form with price, breakdown, and notes
- Real-time status updates

### Login
- URL: https://jesus-travel.site/admin-dashboard.html
- Email: admin@jesus-travel.com
- Password: JesusWayne6667

## 🚀 Next Steps

1. **Test the WhatsApp flow**:
   - Create a test enquiry
   - Reply with a quote from pricing team number
   - Verify customer receives it

2. **Test the dashboard flow**:
   - Login to admin dashboard
   - Submit a quote via the UI
   - Verify customer receives it

3. **Monitor logs** on Render to ensure everything works

## 📞 Support

If you encounter issues:
- Check Render logs for errors
- Verify `PRICING_TEAM_PHONE` is set correctly
- Ensure WhatsApp API is configured
- Use admin dashboard as backup method

