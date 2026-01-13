import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all settings (admin only)
router.get('/', authenticate, getSettings);

// Update settings (admin only)
router.put('/', authenticate, updateSettings);

// Get Google Maps API key (admin only)
router.get('/maps-api-key', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    },
  });
});

export default router;
