import { processWhatsAppMessage } from '../services/whatsapp/messageHandler.js';
import logger from '../utils/logger.js';

export const handleWhatsAppWebhook = async (req, res) => {
  try {
    const webhookData = req.body;

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('📥 WHATSAPP WEBHOOK RECEIVED');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('Webhook Type:', webhookData.typeWebhook);
    logger.info('Full Data:', JSON.stringify(webhookData, null, 2));
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Acknowledge receipt immediately
    res.status(200).json({ success: true });

    // Process message asynchronously
    if (webhookData.typeWebhook === 'incomingMessageReceived') {
      const messageData = webhookData.messageData;
      const senderData = webhookData.senderData;

      // Extract message details
      const message = {
        type: messageData.typeMessage,
        text: messageData.textMessageData?.textMessage || '',
        sender: senderData.sender,
        senderName: senderData.senderName,
        chatId: senderData.chatId,
        timestamp: messageData.timestamp || Date.now(),
      };

      logger.info(`📨 Processing message from ${message.senderName}: "${message.text}"`);

      // Process the message
      processWhatsAppMessage(message).catch((error) => {
        logger.error('❌ Error processing WhatsApp message:', error);
      });
    } else {
      logger.info(`ℹ️ Ignoring webhook type: ${webhookData.typeWebhook}`);
    }
  } catch (error) {
    logger.error('❌ Webhook error:', error);
    // Still return 200 to prevent webhook retries
    res.status(200).json({ success: false, error: error.message });
  }
};
