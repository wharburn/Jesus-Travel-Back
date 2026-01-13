import redis from '../config/redis.js';
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
    const settingsJson = await redis.get(SETTINGS_KEY);

    let settings;
    if (settingsJson) {
      settings = JSON.parse(settingsJson);
      logger.info('Settings loaded from Redis');
    } else {
      // Use default settings
      settings = getDefaultSettings();
      // Save to Redis
      await redis.set(SETTINGS_KEY, JSON.stringify(settings));
      logger.info('Default settings initialized');
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

    // Get current settings
    const settingsJson = await redis.get(SETTINGS_KEY);
    let settings = settingsJson ? JSON.parse(settingsJson) : getDefaultSettings();

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
      notifications: {
        ...settings.notifications,
        ...(updates.notifications || {}),
      },
    };

    // Save to Redis
    await redis.set(SETTINGS_KEY, JSON.stringify(settings));

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
