import redis from '../config/redis.js';
import logger from './logger.js';

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
    const settingsJson = await redis.get(SETTINGS_KEY);

    if (settingsJson) {
      return JSON.parse(settingsJson);
    }

    // Return defaults
    const defaults = getDefaultSettings();
    // Save defaults to Redis for next time
    await redis.set(SETTINGS_KEY, JSON.stringify(defaults));
    return defaults;
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
    await redis.set(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    logger.error('Error updating settings:', error);
    throw error;
  }
};

