import redis from '../config/redis.js';
import Enquiry from '../models/Enquiry.js';
import { calculateQuote } from '../services/pricing/pricingEngine.js';
import { sendWhatsAppMessage } from '../services/whatsapp/client.js';
import { errorResponse, successResponse } from '../utils/helpers.js';
import logger from '../utils/logger.js';

// Helper function to notify pricing team (manual mode with AI estimate)
async function notifyPricingTeamManual(enquiry) {
  try {
    const pricingTeamPhone = process.env.PRICING_TEAM_PHONE;
    if (pricingTeamPhone) {
      let aiEstimate = null;
      let estimateMessage = '';

      // Check how many pending enquiries exist
      const allEnquiries = await Enquiry.findAll();
      const pendingCount = allEnquiries.filter((e) => e.status === 'pending_quote').length;

      // Try to get AI price estimate
      try {
        // Check if Google Maps API key is configured
        if (!process.env.GOOGLE_MAPS_API_KEY) {
          throw new Error('Google Maps API key not configured');
        }

        const pickupDatetime = `${enquiry.pickupDate}T${enquiry.pickupTime}:00Z`;

        logger.info(
          `🤖 Attempting AI estimate for ${enquiry.referenceNumber}: ${enquiry.pickupLocation} → ${enquiry.dropoffLocation}`
        );

        const quote = await calculateQuote({
          pickupAddress: enquiry.pickupLocation,
          dropoffAddress: enquiry.dropoffLocation,
          pickupDatetime: pickupDatetime,
          vehicleType: enquiry.vehicleType,
          passengers: enquiry.passengers,
        });

        aiEstimate = quote;

        // Store AI estimate in enquiry for quick approval
        enquiry.aiEstimate = {
          total_amount: quote.pricing.total_amount,
          base_fare: quote.pricing.base_fare,
          distance_charge: quote.pricing.distance_charge,
          zone_charges: quote.pricing.zone_charges,
          time_multiplier: quote.pricing.time_multiplier_name,
          distance: quote.distance.text,
          duration: quote.duration.text,
          zones: quote.zones.map((z) => z.zone_name),
        };
        await enquiry.save();

        estimateMessage =
          `\n🤖 AI PRICE ESTIMATE: £${quote.pricing.total_amount}\n` +
          `📏 Distance: ${quote.distance.text} (${quote.duration.text})\n` +
          `⏰ ${quote.pricing.time_multiplier_name} pricing\n` +
          `${quote.zones.length > 0 ? `📍 Zones: ${quote.zones.map((z) => z.zone_name).join(', ')}\n` : ''}` +
          `\nBreakdown:\n` +
          `  Base fare: £${quote.pricing.base_fare}\n` +
          `  Distance: £${quote.pricing.distance_charge}\n` +
          `  ${quote.pricing.zone_charges > 0 ? `Zone charges: £${quote.pricing.zone_charges}\n` : ''}` +
          `\n━━━━━━━━━━━━━━━━━━━━\n`;

        logger.info(
          `🤖 AI estimate calculated: £${quote.pricing.total_amount} for ${enquiry.referenceNumber}`
        );
      } catch (error) {
        logger.error(`❌ Could not calculate AI estimate for ${enquiry.referenceNumber}:`, {
          error: error.message,
          stack: error.stack,
          pickup: enquiry.pickupLocation,
          dropoff: enquiry.dropoffLocation,
          googleMapsConfigured: !!process.env.GOOGLE_MAPS_API_KEY,
        });
        estimateMessage =
          `\n⚠️ AI estimate unavailable\n` +
          `Reason: ${error.message}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n`;
      }

      // Extract last 3 digits of reference number (e.g., JT-2026-000123 -> 123)
      const jobNumber = enquiry.referenceNumber.slice(-3);

      const message =
        `🆕 New Booking Enquiry ${pendingCount > 1 ? `(${pendingCount} pending)` : ''}\n\n` +
        `Job: ${jobNumber}\n` +
        `Ref: ${enquiry.referenceNumber}\n` +
        `Customer: ${enquiry.customerName}\n` +
        `Phone: ${enquiry.customerPhone}\n` +
        `From: ${enquiry.pickupLocation}\n` +
        `To: ${enquiry.dropoffLocation}\n` +
        `Date: ${enquiry.pickupDate} at ${enquiry.pickupTime}\n` +
        `Passengers: ${enquiry.passengers}\n` +
        `Vehicle: ${enquiry.vehicleType}\n` +
        `${enquiry.specialRequests ? `Notes: ${enquiry.specialRequests}\n` : ''}` +
        estimateMessage +
        `📝 QUICK REPLIES:\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${aiEstimate ? `✅ ${jobNumber} OK  (approve £${aiEstimate.pricing.total_amount})\n` : ''}` +
        `💰 ${jobNumber} ${aiEstimate ? aiEstimate.pricing.total_amount : '85'}  (set price)\n` +
        `📦 ${jobNumber} ${aiEstimate ? aiEstimate.pricing.total_amount : '85'} +MG  (with extras)\n\n` +
        `Add-ons:\n` +
        `+MG=Meet&Greet +CS=ChildSeat +BS=Booster\n` +
        `+WC=Wheelchair +LG=ExtraLuggage +WF=WiFi\n` +
        `+WA=Wait&Return\n\n` +
        `Full format:\n` +
        `QUOTE ${enquiry.referenceNumber} £[PRICE]`;

      await sendWhatsAppMessage(pricingTeamPhone, message);
      logger.info(`📱 Manual quote request sent to pricing team with AI estimate`);
    }
  } catch (error) {
    logger.error('Failed to notify pricing team:', error);
    // Don't fail the request if notification fails
  }
}

export const createEnquiry = async (req, res, next) => {
  try {
    // Log incoming request for debugging
    logger.info('Received enquiry request:', JSON.stringify(req.body));

    const enquiryData = {
      customerName: req.body.customerName,
      customerPhone: req.body.customerPhone,
      customerEmail: req.body.customerEmail,
      pickupLocation: req.body.pickupLocation,
      dropoffLocation: req.body.dropoffLocation,
      pickupDate: req.body.pickupDate,
      pickupTime: req.body.pickupTime,
      passengers: req.body.passengers || 1,
      vehicleType: req.body.vehicleType || 'Saloon',
      specialRequests: req.body.specialRequests || '',
      source: req.body.source || 'web',
    };

    const enquiry = new Enquiry(enquiryData);
    await enquiry.save();

    logger.info(`New enquiry created: ${enquiry.referenceNumber}`);

    // Check if auto-quote mode is enabled (from settings or env)
    let autoQuoteMode = process.env.AUTO_QUOTE_MODE === 'true';

    try {
      const settingsJson = await redis.get('app:settings');
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        autoQuoteMode = settings.quotes?.autoQuoteMode === true;
      }
    } catch (error) {
      logger.warn('Could not load settings from Redis, using env variable');
    }

    if (autoQuoteMode) {
      // AUTO MODE: Calculate and send quote automatically
      try {
        logger.info(`🤖 Auto-quote mode enabled for ${enquiry.referenceNumber}`);

        // Calculate quote
        const pickupDatetime = `${enquiry.pickupDate}T${enquiry.pickupTime}:00Z`;
        const quote = await calculateQuote({
          pickupAddress: enquiry.pickupLocation,
          dropoffAddress: enquiry.dropoffLocation,
          pickupDatetime: pickupDatetime,
          vehicleType: enquiry.vehicleType,
          passengers: enquiry.passengers,
        });

        // Update enquiry with auto-generated quote
        enquiry.quotedPrice = quote.pricing.total_amount;
        enquiry.quoteBreakdown = JSON.stringify({
          base_fare: quote.pricing.base_fare,
          distance_charge: quote.pricing.distance_charge,
          zone_charges: quote.pricing.zone_charges,
          zones: quote.zones,
          time_multiplier: quote.pricing.time_multiplier_name,
          distance: quote.distance,
          duration: quote.duration,
        });
        enquiry.status = 'quoted';
        enquiry.quotedAt = new Date();
        enquiry.quotedBy = 'AUTO_SYSTEM';
        enquiry.quoteValidUntil = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
        await enquiry.save();

        // Send quote to customer
        const customerMessage =
          `✅ Quote Ready - ${enquiry.referenceNumber}\n\n` +
          `Dear ${enquiry.customerName},\n\n` +
          `Thank you for your enquiry. Here's your quote:\n\n` +
          `📍 From: ${enquiry.pickupLocation}\n` +
          `📍 To: ${enquiry.dropoffLocation}\n` +
          `📅 Date: ${enquiry.pickupDate} at ${enquiry.pickupTime}\n` +
          `🚗 Vehicle: ${enquiry.vehicleType}\n` +
          `👥 Passengers: ${enquiry.passengers}\n\n` +
          `💰 Total Price: £${enquiry.quotedPrice}\n` +
          `${quote.zones.length > 0 ? `\n📍 Zones: ${quote.zones.map((z) => z.zone_name).join(', ')}\n` : ''}` +
          `⏰ ${quote.pricing.time_multiplier_name} pricing\n` +
          `🛣️ Distance: ${quote.distance.text} (${quote.duration.text})\n\n` +
          `This quote is valid until ${new Date(enquiry.quoteValidUntil).toLocaleString('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}\n\n` +
          `Reply "YES" to confirm your booking or contact us for any questions.`;

        await sendWhatsAppMessage(enquiry.customerPhone, customerMessage);
        logger.info(`✅ Auto-quote sent to customer: ${enquiry.customerPhone}`);

        // Notify pricing team (for monitoring)
        const pricingTeamPhone = process.env.PRICING_TEAM_PHONE;
        if (pricingTeamPhone) {
          const teamMessage =
            `🤖 AUTO-QUOTE SENT\n\n` +
            `Ref: ${enquiry.referenceNumber}\n` +
            `Customer: ${enquiry.customerName}\n` +
            `Quote: £${enquiry.quotedPrice}\n` +
            `From: ${enquiry.pickupLocation}\n` +
            `To: ${enquiry.dropoffLocation}\n\n` +
            `✅ Quote automatically sent to customer\n` +
            `To modify, use admin dashboard`;

          await sendWhatsAppMessage(pricingTeamPhone, teamMessage);
        }
      } catch (error) {
        logger.error('Auto-quote failed, falling back to manual mode:', error);
        // Fall back to manual mode if auto-quote fails
        await notifyPricingTeamManual(enquiry);
      }
    } else {
      // MANUAL MODE: Notify pricing team for review
      await notifyPricingTeamManual(enquiry);
    }

    res.status(201).json(successResponse(enquiry.toJSON(), 'Enquiry created successfully'));
  } catch (error) {
    logger.error('Error creating enquiry:', error);
    next(error);
  }
};

export const getEnquiries = async (req, res, next) => {
  try {
    const {
      status,
      customerPhone,
      customerEmail,
      pickupDate,
      source,
      search,
      limit = 20,
      offset = 0,
    } = req.query;

    let enquiries;

    // Use advanced search if filters are provided
    if (customerPhone || customerEmail || pickupDate || source || search) {
      const filters = {
        status,
        customerPhone,
        customerEmail,
        pickupDate,
        source,
        limit: parseInt(limit),
      };

      // Add text search if provided
      if (search) {
        filters.pickupLocation = search;
        filters.dropoffLocation = search;
        filters.customerName = search;
      }

      enquiries = await Enquiry.search(filters);
    } else if (status) {
      enquiries = await Enquiry.findByStatus(status, parseInt(limit), parseInt(offset));
    } else {
      enquiries = await Enquiry.findAll(parseInt(limit), parseInt(offset));
    }

    // Filter out any null/invalid enquiries and safely convert to JSON
    const validEnquiries = enquiries
      .filter((e) => e !== null && e !== undefined)
      .map((e) => {
        try {
          return e.toJSON ? e.toJSON() : e;
        } catch (err) {
          logger.error('Error converting enquiry to JSON:', err);
          return null;
        }
      })
      .filter((e) => e !== null);

    res.json(
      successResponse({
        enquiries: validEnquiries,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: validEnquiries.length,
        },
      })
    );
  } catch (error) {
    logger.error('Error fetching enquiries:', error);
    next(error);
  }
};

export const getEnquiryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to find by ID or reference number
    let enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      enquiry = await Enquiry.findByReference(id);
    }

    if (!enquiry) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Enquiry not found'));
    }

    res.json(successResponse(enquiry.toJSON()));
  } catch (error) {
    logger.error('Error fetching enquiry:', error);
    next(error);
  }
};

export const submitQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price, currency = 'GBP', breakdown, validUntil, notes } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Enquiry not found'));
    }

    if (enquiry.status !== 'pending_quote') {
      return res.status(400).json(errorResponse('INVALID_STATUS', 'Enquiry already has a quote'));
    }

    // Calculate quote validity (default 48 hours)
    const quoteValidUntil = validUntil || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await enquiry.update({
      status: 'quoted',
      quotedPrice: price,
      quotedBy: req.user.id,
      quotedAt: new Date().toISOString(),
      quoteBreakdown: breakdown,
      quoteValidUntil,
    });

    logger.info(`Quote submitted for enquiry ${enquiry.referenceNumber}: ${currency}${price}`);

    // Prepare quote message for customer
    const message =
      `✅ Quote Ready - ${enquiry.referenceNumber}\n\n` +
      `Dear ${enquiry.customerName},\n\n` +
      `Thank you for your enquiry. Here's your quote:\n\n` +
      `📍 From: ${enquiry.pickupLocation}\n` +
      `📍 To: ${enquiry.dropoffLocation}\n` +
      `📅 Date: ${enquiry.pickupDate} at ${enquiry.pickupTime}\n` +
      `🚗 Vehicle: ${enquiry.vehicleType}\n\n` +
      `💰 Total Price: £${price}\n` +
      `${notes ? `\nNotes: ${notes}\n` : ''}` +
      `\nThis quote is valid until ${new Date(quoteValidUntil).toLocaleString()}\n\n` +
      `Reply "YES" to confirm your booking or contact us for any questions.`;

    // Log the quote message prominently
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('📤 QUOTE TO SEND TO CUSTOMER:');
    logger.info(`📞 Phone: ${enquiry.customerPhone}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(message);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Try to send quote to customer via WhatsApp (but don't fail if it doesn't work)
    try {
      await sendWhatsAppMessage(enquiry.customerPhone, message);
      logger.info(`✅ Quote sent via WhatsApp to ${enquiry.customerPhone}`);
    } catch (error) {
      logger.warn(
        `⚠️ Failed to send quote via WhatsApp to ${enquiry.customerPhone}:`,
        error.message
      );
      logger.warn('💡 Please send the quote manually via SMS/WhatsApp using the message above');
    }

    res.json(
      successResponse(
        {
          ...enquiry.toJSON(),
          quoteMessage: message,
          customerPhone: enquiry.customerPhone,
        },
        'Quote submitted successfully'
      )
    );
  } catch (error) {
    logger.error('Error submitting quote:', error);
    next(error);
  }
};

export const acceptQuote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enquiry = (await Enquiry.findById(id)) || (await Enquiry.findByReference(id));
    if (!enquiry) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Enquiry not found'));
    }

    if (enquiry.status !== 'quoted') {
      return res.status(400).json(errorResponse('INVALID_STATUS', 'No quote available to accept'));
    }

    // Check if quote is still valid
    if (new Date(enquiry.quoteValidUntil) < new Date()) {
      return res.status(400).json(errorResponse('QUOTE_EXPIRED', 'Quote has expired'));
    }

    await enquiry.update({ status: 'confirmed' });

    logger.info(`Quote accepted for enquiry ${enquiry.referenceNumber}`);

    // TODO: Create booking from enquiry

    res.json(successResponse(enquiry.toJSON(), 'Quote accepted successfully'));
  } catch (error) {
    logger.error('Error accepting quote:', error);
    next(error);
  }
};

export const rejectQuote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enquiry = (await Enquiry.findById(id)) || (await Enquiry.findByReference(id));
    if (!enquiry) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Enquiry not found'));
    }

    if (enquiry.status !== 'quoted') {
      return res.status(400).json(errorResponse('INVALID_STATUS', 'No quote available to reject'));
    }

    await enquiry.update({ status: 'cancelled' });

    logger.info(`Quote rejected for enquiry ${enquiry.referenceNumber}`);

    res.json(successResponse(enquiry.toJSON(), 'Quote rejected'));
  } catch (error) {
    logger.error('Error rejecting quote:', error);
    next(error);
  }
};

export const forwardToPartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { partnerName, commissionRate, bookingReference, notes } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Enquiry not found'));
    }

    if (enquiry.forwardedToPartner) {
      return res
        .status(400)
        .json(errorResponse('ALREADY_FORWARDED', 'Enquiry already forwarded to a partner'));
    }

    // Calculate commission amount if price is available
    let commissionAmount = null;
    if (enquiry.quotedPrice && commissionRate) {
      commissionAmount = (enquiry.quotedPrice * commissionRate) / 100;
    }

    // Update enquiry with partner forwarding details
    await enquiry.update({
      forwardedToPartner: true,
      partnerName,
      partnerCommissionRate: commissionRate || null,
      partnerCommissionAmount: commissionAmount,
      partnerBookingReference: bookingReference || null,
      partnerNotes: notes || null,
      forwardedAt: new Date().toISOString(),
      forwardedBy: req.user.id,
      status: 'forwarded', // New status for forwarded bookings
    });

    logger.info(
      `Enquiry ${enquiry.referenceNumber} forwarded to ${partnerName} by ${req.user.email}`
    );

    // Generate booking export data for partner
    const exportData = {
      referenceNumber: enquiry.referenceNumber,
      customerName: enquiry.customerName,
      customerPhone: enquiry.customerPhone,
      customerEmail: enquiry.customerEmail,
      pickupLocation: enquiry.pickupLocation,
      dropoffLocation: enquiry.dropoffLocation,
      pickupDate: enquiry.pickupDate,
      pickupTime: enquiry.pickupTime,
      passengers: enquiry.passengers,
      vehicleType: enquiry.vehicleType,
      specialRequests: enquiry.specialRequests,
      quotedPrice: enquiry.quotedPrice,
      commissionRate: commissionRate,
      commissionAmount: commissionAmount,
    };

    res.json(
      successResponse(
        {
          enquiry: enquiry.toJSON(),
          exportData,
        },
        'Enquiry forwarded to partner successfully'
      )
    );
  } catch (error) {
    logger.error('Error forwarding to partner:', error);
    next(error);
  }
};

// Delete single enquiry (admin only)
export const deleteEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Enquiry not found'));
    }

    const referenceNumber = enquiry.referenceNumber;
    await enquiry.delete();

    logger.info(`Enquiry ${referenceNumber} deleted by admin`);

    res.json(successResponse({ id, referenceNumber }, 'Enquiry deleted successfully'));
  } catch (error) {
    logger.error('Error deleting enquiry:', error);
    next(error);
  }
};

// Clear all enquiries (admin only - for debugging)
export const clearAllEnquiries = async (req, res, next) => {
  try {
    const deleted = await Enquiry.deleteAll();

    res.json(
      successResponse({
        deleted,
        message: 'All enquiries cleared successfully',
      })
    );
  } catch (error) {
    logger.error('Error clearing enquiries:', error);
    next(error);
  }
};
