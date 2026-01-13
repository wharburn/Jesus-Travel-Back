import redis from '../config/redis.js';
import logger from './logger.js';

const SETTINGS_KEY = 'app:settings';

// Default settings from environment variables
export const getDefaultSettings = () => ({
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
    standardSedan: {
      baseFare: 50.0,
      perKmRate: 2.0,
    },
    executiveSedan: {
      baseFare: 60.0,
      perKmRate: 2.5,
    },
    luxurySedan: {
      baseFare: 80.0,
      perKmRate: 3.0,
    },
    executiveMPV: {
      baseFare: 100.0,
      perKmRate: 3.8,
    },
    luxuryMPV: {
      baseFare: 120.0,
      perKmRate: 4.5,
    },
  },
  notifications: {
    emailEnabled: true,
    whatsappEnabled: true,
    smsEnabled: false,
  },
});

/**
 * Get application settings
 * Returns settings from Redis or defaults from environment
 */
export const getSettings = async () => {
  try {
    let settings = await redis.get(SETTINGS_KEY);

    // Handle legacy string storage or missing value
    if (!settings || typeof settings !== 'object' || settings === '[object Object]') {
      const defaults = getDefaultSettings();
      await redis.set(SETTINGS_KEY, defaults);
      return defaults;
    }

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

    return settings;
  } catch (error) {
    logger.error('Error getting settings, using defaults:', error);
    return getDefaultSettings();
  }
};

/**
 * Get a specific setting value
 */
export const getSetting = async (path) => {
  const settings = await getSettings();
  const keys = path.split('.');
  let value = settings;

  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      return null;
    }
  }

  return value;
};

/**
 * Update settings
 */
export const updateSettings = async (updates) => {
  try {
    const current = await getSettings();
    const updated = { ...current, ...updates };
    await redis.set(SETTINGS_KEY, updated);
    return updated;
  } catch (error) {
    logger.error('Error updating settings:', error);
    throw error;
  }
};
