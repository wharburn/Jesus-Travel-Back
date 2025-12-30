import express from 'express';
import { handleWhatsAppWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// WhatsApp webhook from Green API
router.post('/whatsapp', handleWhatsAppWebhook);

export default router;

