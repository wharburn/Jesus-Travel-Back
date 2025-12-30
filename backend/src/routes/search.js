import express from 'express';
import Enquiry from '../models/Enquiry.js';
import { isSearchAvailable } from '../services/searchService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   GET /api/search/enquiries
 * @desc    Search enquiries using AI-powered search
 * @access  Public (should be protected in production)
 */
router.get('/enquiries', async (req, res) => {
  try {
    const { q, limit = 10, status } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    if (!isSearchAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Search service is not available',
      });
    }

    // Build search options
    const options = {
      limit: parseInt(limit, 10),
    };

    // Add status filter if provided
    if (status) {
      options.filter = { status };
    }

    // Perform search
    const results = await Enquiry.search(q, options);

    logger.info(`Search for "${q}" returned ${results.length} results`);

    res.json({
      success: true,
      data: {
        query: q,
        count: results.length,
        results: results.map((enquiry) => enquiry.toJSON()),
      },
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search enquiries',
    });
  }
});

/**
 * @route   GET /api/search/status
 * @desc    Check if search is available
 * @access  Public
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      available: isSearchAvailable(),
    },
  });
});

export default router;

