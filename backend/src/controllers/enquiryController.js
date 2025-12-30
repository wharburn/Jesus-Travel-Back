import Enquiry from '../models/Enquiry.js';
import { sendWhatsAppMessage } from '../services/whatsapp/client.js';
import { errorResponse, successResponse } from '../utils/helpers.js';
import logger from '../utils/logger.js';

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

    // Notify pricing team
    try {
      const pricingTeamPhone = process.env.PRICING_TEAM_PHONE;
      if (pricingTeamPhone) {
        const message =
          `🆕 New Booking Enquiry\n\n` +
          `Ref: ${enquiry.referenceNumber}\n` +
          `Customer: ${enquiry.customerName}\n` +
          `From: ${enquiry.pickupLocation}\n` +
          `To: ${enquiry.dropoffLocation}\n` +
          `Date: ${enquiry.pickupDate} at ${enquiry.pickupTime}\n` +
          `Passengers: ${enquiry.passengers}\n` +
          `Vehicle: ${enquiry.vehicleType}\n` +
          `${enquiry.specialRequests ? `Notes: ${enquiry.specialRequests}\n` : ''}` +
          `\nPlease review and submit a quote.`;

        await sendWhatsAppMessage(pricingTeamPhone, message);
      }
    } catch (error) {
      logger.error('Failed to notify pricing team:', error);
      // Don't fail the request if notification fails
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

    res.json(
      successResponse({
        enquiries: enquiries.map((e) => (e.toJSON ? e.toJSON() : e)),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: enquiries.length,
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

    // Send quote to customer via WhatsApp
    try {
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

      await sendWhatsAppMessage(enquiry.customerPhone, message);
    } catch (error) {
      logger.error('Failed to send quote to customer:', error);
    }

    res.json(successResponse(enquiry.toJSON(), 'Quote submitted successfully'));
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
