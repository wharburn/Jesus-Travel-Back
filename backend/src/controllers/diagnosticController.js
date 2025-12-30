import logger from '../utils/logger.js';
import { getInstanceStatus } from '../services/whatsapp/client.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

/**
 * Check WhatsApp configuration and status
 */
export const checkWhatsAppStatus = async (req, res, next) => {
  try {
    const config = {
      instanceId: process.env.GREEN_API_INSTANCE_ID ? '✅ Set' : '❌ Not set',
      token: process.env.GREEN_API_TOKEN ? '✅ Set' : '❌ Not set',
      pricingTeamPhone: process.env.PRICING_TEAM_PHONE || '❌ Not set',
      businessPhone: process.env.BUSINESS_PHONE || '❌ Not set',
    };

    let instanceStatus = null;
    try {
      instanceStatus = await getInstanceStatus();
    } catch (error) {
      logger.error('Failed to get WhatsApp instance status:', error);
    }

    res.json(
      successResponse({
        config,
        instanceStatus,
        message: 'WhatsApp diagnostic check complete',
      })
    );
  } catch (error) {
    logger.error('Error in WhatsApp diagnostic:', error);
    next(error);
  }
};

/**
 * Check environment variables
 */
export const checkEnvironment = async (req, res, next) => {
  try {
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      FRONTEND_URL: process.env.FRONTEND_URL,
      UPSTASH_REDIS: process.env.UPSTASH_REDIS_REST_URL ? '✅ Set' : '❌ Not set',
      OPENROUTER_API: process.env.OPENROUTER_API_KEY ? '✅ Set' : '❌ Not set',
      GREEN_API_INSTANCE: process.env.GREEN_API_INSTANCE_ID ? '✅ Set' : '❌ Not set',
      GREEN_API_TOKEN: process.env.GREEN_API_TOKEN ? '✅ Set' : '❌ Not set',
      PRICING_TEAM_PHONE: process.env.PRICING_TEAM_PHONE || '❌ Not set',
      BUSINESS_PHONE: process.env.BUSINESS_PHONE || '❌ Not set',
      ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET ? '✅ Set' : '❌ Not set',
    };

    res.json(successResponse(env, 'Environment check complete'));
  } catch (error) {
    logger.error('Error in environment check:', error);
    next(error);
  }
};

export default {
  checkWhatsAppStatus,
  checkEnvironment,
};

