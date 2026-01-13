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

// Diagnostic endpoint to check pricing system health
router.get('/diagnostics', authenticate, async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
    },
    apis: {
      googleMaps: {
        configured: !!process.env.GOOGLE_MAPS_API_KEY,
        keyPrefix: process.env.GOOGLE_MAPS_API_KEY
          ? process.env.GOOGLE_MAPS_API_KEY.substring(0, 10) + '...'
          : 'NOT SET',
      },
      upstashRedis: {
        configured: !!process.env.UPSTASH_REDIS_REST_URL,
      },
      openRouter: {
        configured: !!process.env.OPENROUTER_API_KEY,
      },
      greenApi: {
        configured: !!process.env.GREEN_API_INSTANCE_ID && !!process.env.GREEN_API_TOKEN,
      },
    },
    pricing: {
      autoQuoteMode: process.env.AUTO_QUOTE_MODE === 'true',
      pricingMode: process.env.PRICING_MODE || 'supervised',
      pricingTeamPhone: process.env.PRICING_TEAM_PHONE
        ? process.env.PRICING_TEAM_PHONE.substring(0, 6) + '...'
        : 'NOT SET',
    },
  };

  // Test pricing rules loading
  try {
    const { getSetting } = await import('../utils/settings.js');
    const pricingRules = await getSetting('pricingRules');
    diagnostics.pricing.rulesLoaded = !!pricingRules;
    diagnostics.pricing.rulesCount = pricingRules ? Object.keys(pricingRules).length : 0;
  } catch (error) {
    diagnostics.pricing.rulesError = error.message;
  }

  res.json({
    success: true,
    data: diagnostics,
  });
});

export default router;
