# 🤝 Partner Forwarding System

## Overview
Generic manual system for forwarding overflow bookings to partner companies (Addison Lee, Uber, Bolt, etc.) with automatic commission tracking.

---

## ✅ Features

### 1. **Forward Bookings to Partners**
- Select partner from dropdown (Addison Lee, Uber, Bolt, Local Operator, Other)
- Set commission rate (%)
- Add partner booking reference
- Add notes
- Automatic commission calculation

### 2. **Booking Export**
- Auto-generates formatted booking details for partner
- Includes all customer and journey information
- Shows commission breakdown
- One-click copy to clipboard

### 3. **Commission Tracking**
- View all forwarded bookings
- Track total commission earned
- Partner-by-partner breakdown
- Average commission rate calculation

### 4. **Status Management**
- New status: "Forwarded"
- Prevents duplicate forwarding
- Tracks who forwarded and when

---

## 🎯 How to Use

### **Step 1: Forward a Booking**

1. Go to **Admin Dashboard**: https://jesus-travel.site/admin-dashboard.html
2. Find the enquiry you want to forward
3. Click **"→ Partner"** button
4. Fill in the form:
   - **Partner Name**: Select from dropdown
   - **Commission Rate**: e.g., 15 (for 15%)
   - **Partner Booking Reference**: (optional) Their reference number
   - **Notes**: (optional) Any additional info
5. Click **"→ Forward to Partner"**

### **Step 2: Copy Booking Details**

After forwarding, you'll see a formatted export:
```
BOOKING EXPORT FOR ADDISON LEE
==================================================

Reference: JT-2025-000123
Customer: John Smith
Phone: +447700123456
Email: john@example.com

JOURNEY DETAILS:
Pickup: Heathrow Terminal 5
Dropoff: Park Lane Hotel
Date: 2025-01-15
Time: 14:00

VEHICLE & PASSENGERS:
Vehicle Type: Saloon
Passengers: 2
Special Requests: Child seat required

PRICING:
Quoted Price: £150
Commission Rate: 15%
Commission Amount: £22.50
```

Click **"📋 Copy Booking Details"** to copy this to clipboard.

### **Step 3: Send to Partner**

- Email the booking details to your partner
- Or paste into their booking system
- Or send via WhatsApp/phone

### **Step 4: Track Commissions**

Go to **Partner Commissions**: https://jesus-travel.site/partner-commissions.html

You'll see:
- **Total forwarded bookings**
- **Total booking value**
- **Total commission earned**
- **Average commission rate**
- **Breakdown by partner**
- **Full list of forwarded bookings**

---

## 📊 Commission Reports Page

### Summary Cards
- Total Forwarded: Count of all forwarded bookings
- Total Booking Value: Sum of all quoted prices
- Total Commission: Sum of all commission amounts
- Avg Commission Rate: Average % across all bookings

### Partner Breakdown
Shows for each partner:
- Number of bookings
- Total value
- Total commission earned

### Forwarded Bookings Table
Lists all forwarded bookings with:
- Reference number
- Customer details
- Journey details
- Partner name
- Price
- Commission (amount and %)
- When forwarded and by whom

---

## 🔌 API Endpoint

### Forward to Partner
```
PUT /api/v1/enquiries/:id/forward-to-partner
Authorization: Bearer <admin-token>

Body:
{
  "partnerName": "Addison Lee",
  "commissionRate": 15,
  "bookingReference": "AL-2025-456",
  "notes": "Customer prefers Mercedes"
}

Response:
{
  "success": true,
  "data": {
    "enquiry": { ... },
    "exportData": {
      "referenceNumber": "JT-2025-000123",
      "customerName": "John Smith",
      ...
      "commissionAmount": 22.50
    }
  }
}
```

---

## 💡 Business Use Cases

### 1. **Fleet Capacity Management**
When your fleet is fully booked, forward overflow to partners

### 2. **Vehicle Type Unavailable**
Customer needs a vehicle type you don't have? Forward to partner

### 3. **Geographic Coverage**
Booking outside your service area? Forward to local partner

### 4. **Premium Services**
Customer wants luxury vehicle you don't offer? Forward to premium partner

### 5. **Commission Revenue**
Earn 10-20% commission on bookings you can't fulfill

---

## 📈 Next Steps (Future Enhancements)

### Phase 2: API Integration
- Direct API connection to Addison Lee
- Real-time availability checks
- Automatic booking creation
- Live tracking integration
- Automated invoicing

### Phase 3: Partner Portal
- Partners can view forwarded bookings
- Accept/reject bookings
- Update status
- Submit invoices

### Phase 4: Analytics
- Monthly commission reports
- Partner performance metrics
- Revenue forecasting
- Automated payments

---

## 🎉 Ready to Use!

The system is now live at:
- **Admin Dashboard**: https://jesus-travel.site/admin-dashboard.html
- **Commission Reports**: https://jesus-travel.site/partner-commissions.html

Start forwarding bookings and tracking commissions today! 🚀

