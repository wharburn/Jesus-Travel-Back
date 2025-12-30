import express from 'express';
import { body } from 'express-validator';
import {
  acceptQuote,
  clearAllEnquiries,
  createEnquiry,
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

// Public routes
router.post('/', createEnquiryValidation, validate, createEnquiry);
router.get('/:id', getEnquiryById);
router.put('/:id/accept', acceptQuote);
router.put('/:id/reject', rejectQuote);

// Admin routes (require authentication)
router.get('/', authenticate, getEnquiries);
router.put('/:id/quote', authenticate, submitQuoteValidation, validate, submitQuote);
router.delete('/clear-all', authenticate, clearAllEnquiries);

export default router;
