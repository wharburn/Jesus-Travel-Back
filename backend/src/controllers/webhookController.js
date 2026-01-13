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

      // Extract message text from different message types
      let text = '';
      if (messageData.textMessageData?.textMessage) {
        text = messageData.textMessageData.textMessage;
      } else if (messageData.extendedTextMessageData?.text) {
        text = messageData.extendedTextMessageData.text;
      }

      // Extract message details
      const message = {
        type: messageData.typeMessage,
        text: text,
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
    } else if (webhookData.typeWebhook === 'outgoingMessageReceived') {
      // Also process outgoing messages (for pricing team commands sent via WhatsApp Web/App)
      const messageData = webhookData.messageData;

      // Extract message text
      let text = '';
      if (messageData.textMessageData?.textMessage) {
        text = messageData.textMessageData.textMessage;
      } else if (messageData.extendedTextMessageData?.text) {
        text = messageData.extendedTextMessageData.text;
      }

      // Get chat ID from webhook data
      const chatId = webhookData.chatId || webhookData.senderData?.chatId;

      // Extract phone number from chatId (remove @c.us)
      const phoneNumber = chatId ? chatId.replace('@c.us', '') : '';

      // Create message object
      const message = {
        type: messageData.typeMessage || 'textMessage',
        text: text,
        sender: chatId,
        senderName: 'Pricing Team',
        chatId: chatId,
        timestamp: webhookData.timestamp || Date.now(),
      };

      logger.info(`📤 Processing outgoing message: "${message.text}"`);

      // Process the message (will be handled as pricing team command)
      processWhatsAppMessage(message).catch((error) => {
        logger.error('❌ Error processing outgoing WhatsApp message:', error);
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
