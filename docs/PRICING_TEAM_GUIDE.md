# Pricing Team WhatsApp Guide

## How to Submit Quotes via WhatsApp

When a new booking enquiry comes in, you'll receive a WhatsApp message like this:

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

---

## How to Reply with a Quote

### Basic Quote (Price Only)

Simply reply with:

```
QUOTE JT-2025-000123 £150
```

### Quote with Notes

Add any additional information after the price:

```
QUOTE JT-2025-000123 £150 Includes meet & greet service and 30 minutes waiting time
```

---

## Format Rules

1. **Start with "QUOTE"** (case insensitive - QUOTE, quote, Quote all work)
2. **Reference number** must match exactly (e.g., JT-2025-000123)
3. **Price** can be with or without £ symbol (e.g., £150 or 150)
4. **Notes** are optional - anything after the price will be included

---

## What Happens Next

1. **You send the quote** - System confirms receipt
2. **Customer receives quote** - Via WhatsApp automatically
3. **Customer can accept** - By replying "YES"
4. **Status updates** - Visible in admin dashboard

---

## Examples

### Example 1: Simple Quote

```
QUOTE JT-2025-000123 £150
```

### Example 2: Quote with Breakdown

```
QUOTE JT-2025-000123 £180 Base fare £150 + Airport fee £30
```

### Example 3: Quote with Special Notes

```
QUOTE JT-2025-000123 £200 Premium service with meet & greet, includes 1 hour waiting time
```

---

## Important Notes

- Only quotes for **pending_quote** status will be accepted
- Quotes are valid for **48 hours** by default
- Customer receives the quote **immediately** after you send it
- You'll get a **confirmation message** when the quote is sent successfully
- If you make a mistake, contact admin to cancel and resubmit

---

## Alternative: Admin Dashboard

You can also submit quotes via the admin dashboard:

1. Navigate to https://jesus-travel.site/admin-dashboard.html
2. Login with admin credentials
3. Click the yellow **"Quote"** button next to any pending enquiry
4. Fill in the quote form and submit

This method is useful when:

- You need to add detailed breakdown
- You want to set custom validity period
- WhatsApp is unavailable

---

## Troubleshooting

### Quote Not Accepted

If your quote isn't accepted, check:

- Reference number is correct (copy/paste from notification)
- Enquiry status is "pending_quote" (check admin dashboard)
- You're sending from the registered pricing team number

### No Confirmation Received

If you don't get a confirmation:

- Wait 30 seconds and check admin dashboard
- Verify WhatsApp connection is stable
- Use admin dashboard as backup

---

## Support

For technical issues:

- Contact the technical team
- Use admin dashboard as backup method
- Check system status on Render dashboard

