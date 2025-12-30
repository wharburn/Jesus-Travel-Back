import express from 'express';
import { handleWhatsAppWebhook } from '../controllers/webhookController.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Test endpoint to verify webhooks are working
router.get('/whatsapp/test', (req, res) => {
  logger.info('✅ Webhook test endpoint called');
  res.json({
    success: true,
    message: 'Webhook endpoint is working!',
    timestamp: new Date().toISOString(),
  });
});

// WhatsApp webhook from Green API
router.post('/whatsapp', handleWhatsAppWebhook);

export default router;
