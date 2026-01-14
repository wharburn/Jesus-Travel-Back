import redis from '../config/redis.js';
import { clearPricingCache } from '../services/pricing/pricingEngine.js';
import logger from '../utils/logger.js';

const SETTINGS_KEY = 'app:settings';

// Default settings from environment variables
const getDefaultSettings = () => ({
  business: {
    name: process.env.BUSINESS_NAME || 'JT Chauffeur Services',
    phone: process.env.BUSINESS_PHONE || '+447700900000',
    email: process.env.BUSINESS_EMAIL || 'bookings@jtchauffeur.com',
    whatsapp: process.env.BUSINESS_WHATSAPP || '+447700900000',
  },
  pricingTeam: {
    phone: process.env.PRICING_TEAM_PHONE || '+447822027794',
    email: process.env.PRICING_TEAM_EMAIL || 'pricing@jtchauffeur.com',
  },
  whatsapp: {
    instanceId: process.env.GREEN_API_INSTANCE_ID || '',
    enabled: !!process.env.GREEN_API_INSTANCE_ID && !!process.env.GREEN_API_TOKEN,
  },
  ai: {
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
    enabled: !!process.env.OPENROUTER_API_KEY,
  },
  quotes: {
    validityDays: 2,
    autoSendToCustomer: true,
    requireApproval: false,
    autoQuoteMode: process.env.AUTO_QUOTE_MODE === 'true',
  },
  pricingRules: {
    executiveSedan: {
      baseFare: 60.0,
      perKmRate: 2.5,
    },
    luxurySedan: {
      baseFare: 80.0,
      perKmRate: 3.0,
    },
    mpvExecutive: {
      baseFare: 100.0,
      perKmRate: 3.5,
    },
    luxurySUV: {
      baseFare: 90.0,
      perKmRate: 3.2,
    },
    minibus: {
      baseFare: 120.0,
      perKmRate: 4.0,
    },
  },
  notifications: {
    emailEnabled: true,
    whatsappEnabled: true,
    smsEnabled: false,
  },
});

/**
 * Get all settings
 */
export const getSettings = async (req, res) => {
  try {
    // Try to get settings from Redis
    // Note: Upstash Redis automatically handles JSON serialization
    let settings = await redis.get(SETTINGS_KEY);

    // Check if settings exist and are valid
    if (!settings || typeof settings !== 'object' || settings === '[object Object]') {
      logger.warn('Settings not found or invalid, initializing defaults');
      // Use default settings
      settings = getDefaultSettings();
      // Save to Redis (Upstash automatically serializes objects - no JSON.stringify needed)
      await redis.set(SETTINGS_KEY, settings);
      logger.info('Default settings initialized');
    } else {
      logger.info('Settings loaded from Redis');

      // Merge with defaults to ensure all fields are present (for backward compatibility)
      const defaults = getDefaultSettings();
      settings = {
        ...defaults,
        ...settings,
        business: { ...defaults.business, ...settings.business },
        pricingTeam: { ...defaults.pricingTeam, ...settings.pricingTeam },
        whatsapp: { ...defaults.whatsapp, ...settings.whatsapp },
        ai: { ...defaults.ai, ...settings.ai },
        quotes: { ...defaults.quotes, ...settings.quotes },
        pricingRules: { ...defaults.pricingRules, ...(settings.pricingRules || {}) },
        notifications: { ...defaults.notifications, ...settings.notifications },
      };
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SETTINGS_ERROR',
        message: 'Failed to retrieve settings',
      },
    });
  }
};

/**
 * Update settings
 */
export const updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    // Get current settings (Upstash automatically deserializes)
    let settings = await redis.get(SETTINGS_KEY);
    if (!settings || typeof settings !== 'object') {
      settings = getDefaultSettings();
    }

    // Merge updates with current settings
    settings = {
      ...settings,
      ...updates,
      business: {
        ...settings.business,
        ...(updates.business || {}),
      },
      pricingTeam: {
        ...settings.pricingTeam,
        ...(updates.pricingTeam || {}),
      },
      whatsapp: {
        ...settings.whatsapp,
        ...(updates.whatsapp || {}),
      },
      ai: {
        ...settings.ai,
        ...(updates.ai || {}),
      },
      quotes: {
        ...settings.quotes,
        ...(updates.quotes || {}),
      },
      pricingRules: {
        ...settings.pricingRules,
        ...(updates.pricingRules || {}),
      },
      notifications: {
        ...settings.notifications,
        ...(updates.notifications || {}),
      },
    };

    // Save to Redis (Upstash automatically serializes - no JSON.stringify needed)
    await redis.set(SETTINGS_KEY, settings);

    // Clear pricing cache if pricing rules were updated
    if (updates.pricingRules) {
      clearPricingCache();
      logger.info('Pricing rules cache cleared');
    }

    logger.info('Settings updated successfully', { updates });

    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SETTINGS_UPDATE_ERROR',
        message: 'Failed to update settings',
      },
    });
  }
};
