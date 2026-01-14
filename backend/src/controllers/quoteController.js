import 'dotenv/config';
import Quote from '../models/Quote.js';
import {
  calculateDisposalQuote,
  calculateQuote,
  formatQuoteForCustomer,
} from '../services/pricing/pricingEngine.js';
import { sendWhatsAppMessage } from '../services/whatsapp/client.js';

/**
 * Calculate quote (without saving)
 * POST /api/v1/quotes/calculate
 */
const calculateQuoteOnly = async (req, res) => {
  try {
    const quote = await calculateQuote(req.body);

    res.json({
      success: true,
      quote: quote,
    });
  } catch (error) {
    console.error('Calculate quote error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Calculate disposal quote (without saving)
 * POST /api/v1/quotes/calculate-disposal
 */
const calculateDisposalQuoteOnly = async (req, res) => {
  try {
    const quote = await calculateDisposalQuote(req.body);

    res.json({
      success: true,
      quote: quote,
    });
  } catch (error) {
    console.error('Calculate disposal quote error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Generate and save quote
 * POST /api/v1/quotes/generate
 */
const generateQuote = async (req, res) => {
  try {
    const {
      pickupAddress,
      dropoffAddress,
      pickupDatetime,
      vehicleType,
      passengers,
      luggage,
      customerName,
      customerPhone,
      customerEmail,
      enquiryId,
    } = req.body;

    // Calculate quote
    const quoteData = await calculateQuote({
      pickupAddress,
      dropoffAddress,
      pickupDatetime,
      vehicleType,
      passengers,
      luggage,
    });

    // Add customer details
    quoteData.customer_name = customerName;
    quoteData.customer_phone = customerPhone;
    quoteData.customer_email = customerEmail;
    quoteData.enquiry_id = enquiryId;

    // Save to database
    const savedQuote = await Quote.create(quoteData);

    // Check pricing mode
    const pricingMode = process.env.PRICING_MODE || 'supervised';
    const notifyPricingTeam = process.env.NOTIFY_PRICING_TEAM === 'true';

    if (pricingMode === 'supervised' && notifyPricingTeam) {
      // Send to pricing team for approval
      await sendQuoteToPricingTeam(savedQuote, quoteData);
    } else if (pricingMode === 'auto') {
      // Auto-approve and send to customer
      await Quote.approve(savedQuote.id, savedQuote.total_amount, 'system');
      await sendQuoteToCustomer(savedQuote, quoteData, customerPhone);
    } else if (pricingMode === 'hybrid') {
      // Check threshold
      const threshold = parseFloat(process.env.AUTO_QUOTE_THRESHOLD || 500);

      if (savedQuote.total_amount < threshold) {
        // Auto-approve and send
        await Quote.approve(savedQuote.id, savedQuote.total_amount, 'system');
        await sendQuoteToCustomer(savedQuote, quoteData, customerPhone);
      } else {
        // Send to pricing team
        await sendQuoteToPricingTeam(savedQuote, quoteData);
      }
    }

    res.json({
      success: true,
      quote: savedQuote,
      mode: pricingMode,
    });
  } catch (error) {
    console.error('Generate quote error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Send quote to pricing team for approval (supervised mode)
 */
const sendQuoteToPricingTeam = async (savedQuote, quoteData) => {
  const pricingTeamPhone = process.env.PRICING_TEAM_PHONE;

  if (!pricingTeamPhone) {
    console.warn('⚠️  PRICING_TEAM_PHONE not configured');
    return;
  }

  const message = formatQuoteForPricingTeam(savedQuote, quoteData);

  try {
    await sendWhatsAppMessage(pricingTeamPhone, message);
    console.log(`📱 Quote ${savedQuote.quote_number} sent to pricing team`);
  } catch (error) {
    console.error('Error sending to pricing team:', error);
  }
};

/**
 * Send quote to customer
 */
const sendQuoteToCustomer = async (savedQuote, quoteData, customerPhone) => {
  const message = formatQuoteForCustomer(quoteData);

  try {
    await sendWhatsAppMessage(customerPhone, message);
    await Quote.markAsSent(savedQuote.id);
    console.log(`📱 Quote ${savedQuote.quote_number} sent to customer`);
  } catch (error) {
    console.error('Error sending to customer:', error);
  }
};

/**
 * Format quote for pricing team (supervised mode)
 */
const formatQuoteForPricingTeam = (savedQuote, quoteData) => {
  const { pickup, dropoff, distance, duration, pricing, vehicle_type } = quoteData;

  let message = `🚗 NEW QUOTE READY - ${savedQuote.quote_number}\n\n`;

  if (savedQuote.customer_name) {
    message += `Customer: ${savedQuote.customer_name}\n`;
  }
  if (savedQuote.customer_phone) {
    message += `📞 ${savedQuote.customer_phone}\n`;
  }
  message += `\n`;
  message += `📍 From: ${pickup.formatted_address}\n`;
  message += `📍 To: ${dropoff.formatted_address}\n`;
  message += `📅 Date: ${new Date(savedQuote.pickup_datetime).toLocaleString('en-GB')}\n`;
  message += `🚗 Vehicle: ${vehicle_type}\n`;
  if (savedQuote.passengers) {
    message += `👥 Passengers: ${savedQuote.passengers}\n`;
  }
  message += `\n`;
  message += `💰 SUGGESTED QUOTE: £${pricing.total_amount.toFixed(2)}\n\n`;
  message += `📊 Breakdown:\n`;
  message += `   Base Fare:         £${pricing.base_fare.toFixed(2)}\n`;
  message += `   Distance (${distance.km}km): £${pricing.distance_charge.toFixed(2)}\n`;

  if (pricing.zone_breakdown.length > 0) {
    pricing.zone_breakdown.forEach((zone) => {
      message += `   ${zone.name}: £${zone.charge.toFixed(2)}\n`;
    });
  }

  message += `   Subtotal:          £${pricing.subtotal.toFixed(2)}\n`;

  if (pricing.time_multiplier !== 1.0) {
    message += `   ${pricing.time_multiplier_name} (${pricing.time_multiplier}x): Applied\n`;
  }

  message += `   ─────────────────────────\n`;
  message += `   TOTAL:            £${pricing.total_amount.toFixed(2)}\n\n`;
  message += `⏱️ Distance: ${distance.km} km (~${duration.minutes} mins)\n\n`;
  message += `Reply with:\n`;
  message += `✅ APPROVE - Send £${pricing.total_amount.toFixed(2)}\n`;
  message += `✏️ MODIFY £XXX - Change price\n`;
  message += `❌ REJECT - Don't send`;

  return message;
};

/**
 * Get quote by ID
 * GET /api/v1/quotes/:id
 */
const getQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found',
      });
    }

    res.json({
      success: true,
      quote: quote,
    });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get recent quotes
 * GET /api/v1/quotes
 */
const getRecentQuotes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const quotes = await Quote.getRecent(limit);

    res.json({
      success: true,
      quotes: quotes,
      count: quotes.length,
    });
  } catch (error) {
    console.error('Get recent quotes error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export {
  calculateDisposalQuoteOnly,
  calculateQuoteOnly,
  generateQuote,
  getQuote,
  getRecentQuotes,
  sendQuoteToCustomer,
  sendQuoteToPricingTeam,
};
