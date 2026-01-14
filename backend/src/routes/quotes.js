import express from 'express';
import {
  calculateDisposalQuoteOnly,
  calculateQuoteOnly,
  generateQuote,
  getQuote,
  getRecentQuotes,
} from '../controllers/quoteController.js';

const router = express.Router();

/**
 * @route   POST /api/v1/quotes/calculate
 * @desc    Calculate quote without saving
 * @access  Public
 */
router.post('/calculate', calculateQuoteOnly);

/**
 * @route   POST /api/v1/quotes/calculate-disposal
 * @desc    Calculate disposal (hourly) quote without saving
 * @access  Public
 */
router.post('/calculate-disposal', calculateDisposalQuoteOnly);

/**
 * @route   POST /api/v1/quotes/generate
 * @desc    Generate and save quote (triggers supervised/auto workflow)
 * @access  Public
 */
router.post('/generate', generateQuote);

/**
 * @route   GET /api/v1/quotes/:id
 * @desc    Get quote by ID
 * @access  Public
 */
router.get('/:id', getQuote);

/**
 * @route   GET /api/v1/quotes
 * @desc    Get recent quotes
 * @access  Public
 */
router.get('/', getRecentQuotes);

export default router;
