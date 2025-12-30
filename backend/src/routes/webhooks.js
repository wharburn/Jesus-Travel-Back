import express from 'express';
import { handleWhatsAppWebhook } from '../controllers/webhookController.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Test endpoint to verify webhooks are working
router.get('/whatsapp/test', (req, res) => {
  logger.info('✅ Webhook test endpoint called');

  const pricingTeamPhone = process.env.PRICING_TEAM_PHONE;
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const hasToken = !!process.env.GREEN_API_TOKEN;

  res.json({
    success: true,
    message: 'Webhook endpoint is working!',
    timestamp: new Date().toISOString(),
    config: {
      pricingTeamPhone: pricingTeamPhone ? `${pricingTeamPhone.substring(0, 6)}...` : 'NOT SET',
      instanceId: instanceId ? `${instanceId.substring(0, 4)}...` : 'NOT SET',
      hasToken: hasToken,
      webhookUrl: `${process.env.BACKEND_URL || 'https://jesus-travel-back.onrender.com'}/api/v1/webhooks/whatsapp`,
    },
  });
});

// WhatsApp webhook from Green API
router.post('/whatsapp', handleWhatsAppWebhook);

export default router;
