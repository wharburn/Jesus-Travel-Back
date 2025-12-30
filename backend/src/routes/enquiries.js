import express from 'express';
import { body } from 'express-validator';
import {
  acceptQuote,
  clearAllEnquiries,
  createEnquiry,
  deleteEnquiry,
  getEnquiries,
  getEnquiryById,
  rejectQuote,
  submitQuote,
} from '../controllers/enquiryController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Validation rules
const createEnquiryValidation = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('customerPhone').trim().notEmpty().withMessage('Customer phone is required'),
  body('customerEmail').optional().isEmail().withMessage('Invalid email format'),
  body('pickupLocation').trim().notEmpty().withMessage('Pickup location is required'),
  body('dropoffLocation').trim().notEmpty().withMessage('Dropoff location is required'),
  body('pickupDate').trim().notEmpty().withMessage('Pickup date is required'),
  body('pickupTime').trim().notEmpty().withMessage('Pickup time is required'),
  body('passengers').optional().isInt({ min: 1 }).withMessage('Passengers must be at least 1'),
  body('vehicleType').optional().trim(),
  body('specialRequests').optional().trim(),
];

const submitQuoteValidation = [
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('currency').optional().isIn(['GBP', 'USD', 'EUR']).withMessage('Invalid currency'),
  body('breakdown').optional().isObject(),
  body('validUntil').optional().isISO8601(),
  body('notes').optional().trim(),
];

const forwardToPartnerValidation = [
  body('partnerName').trim().notEmpty().withMessage('Partner name is required'),
  body('commissionRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission rate must be between 0 and 100'),
  body('bookingReference').optional().trim(),
  body('notes').optional().trim(),
];

// Admin routes (require authentication) - Must be before /:id routes
router.delete('/clear-all', authenticate, clearAllEnquiries);
router.get('/', authenticate, getEnquiries);
router.put('/:id/quote', authenticate, submitQuoteValidation, validate, submitQuote);
router.put(
  '/:id/forward-to-partner',
  authenticate,
  forwardToPartnerValidation,
  validate,
  forwardToPartner
);
router.post('/:id/resend-quote', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const Enquiry = (await import('../models/Enquiry.js')).default;
    const { sendWhatsAppMessage } = await import('../services/whatsapp/client.js');
    const logger = (await import('../utils/logger.js')).default;

    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Enquiry not found' },
      });
    }

    if (enquiry.status !== 'quoted') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Enquiry must have quoted status' },
      });
    }

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
      `${enquiry.quoteBreakdown ? `\n📝 Notes: ${enquiry.quoteBreakdown}\n` : ''}` +
      `\nThis quote is valid until ${new Date(enquiry.quoteValidUntil).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}\n\n` +
      `Reply "YES" to confirm your booking or contact us for any questions.`;

    await sendWhatsAppMessage(enquiry.customerPhone, customerMessage);
    logger.info(`✅ Quote resent to ${enquiry.customerPhone} for ${enquiry.referenceNumber}`);

    res.json({
      success: true,
      data: { message: 'Quote sent successfully', phone: enquiry.customerPhone },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SEND_ERROR', message: error.message },
    });
  }
});
router.delete('/:id', authenticate, deleteEnquiry);

// Public routes
router.post('/', createEnquiryValidation, validate, createEnquiry);
router.get('/:id', getEnquiryById);
router.put('/:id/accept', acceptQuote);
router.put('/:id/reject', rejectQuote);

export default router;
