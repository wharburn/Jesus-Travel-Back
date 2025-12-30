import axios from 'axios';
import logger from '../../utils/logger.js';

const GREEN_API_URL = process.env.GREEN_API_URL || 'https://api.green-api.com';
const INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID;
const TOKEN = process.env.GREEN_API_TOKEN;

if (!INSTANCE_ID || !TOKEN) {
  logger.warn('Green API credentials not configured - WhatsApp features will be disabled');
}

/**
 * Send text message via WhatsApp
 */
export const sendWhatsAppMessage = async (phoneNumber, message) => {
  if (!INSTANCE_ID || !TOKEN) {
    logger.warn('WhatsApp not configured, skipping message send');
    return null;
  }

  try {
    // Format phone number (remove + and spaces)
    const formattedPhone = phoneNumber.replace(/[+\s]/g, '');
    
    const url = `${GREEN_API_URL}/waInstance${INSTANCE_ID}/sendMessage/${TOKEN}`;
    
    const response = await axios.post(url, {
      chatId: `${formattedPhone}@c.us`,
      message: message
    });

    logger.info(`WhatsApp message sent to ${phoneNumber}`);
    return response.data;
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send file via WhatsApp
 */
export const sendWhatsAppFile = async (phoneNumber, fileUrl, caption = '') => {
  if (!INSTANCE_ID || !TOKEN) {
    logger.warn('WhatsApp not configured, skipping file send');
    return null;
  }

  try {
    const formattedPhone = phoneNumber.replace(/[+\s]/g, '');
    
    const url = `${GREEN_API_URL}/waInstance${INSTANCE_ID}/sendFileByUrl/${TOKEN}`;
    
    const response = await axios.post(url, {
      chatId: `${formattedPhone}@c.us`,
      urlFile: fileUrl,
      fileName: 'file',
      caption: caption
    });

    logger.info(`WhatsApp file sent to ${phoneNumber}`);
    return response.data;
  } catch (error) {
    logger.error('Error sending WhatsApp file:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Download file from WhatsApp
 */
export const downloadWhatsAppFile = async (idMessage) => {
  if (!INSTANCE_ID || !TOKEN) {
    logger.warn('WhatsApp not configured');
    return null;
  }

  try {
    const url = `${GREEN_API_URL}/waInstance${INSTANCE_ID}/downloadFile/${TOKEN}`;
    
    const response = await axios.post(url, {
      idMessage: idMessage
    });

    return response.data;
  } catch (error) {
    logger.error('Error downloading WhatsApp file:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get instance status
 */
export const getInstanceStatus = async () => {
  if (!INSTANCE_ID || !TOKEN) {
    return { status: 'not_configured' };
  }

  try {
    const url = `${GREEN_API_URL}/waInstance${INSTANCE_ID}/getStateInstance/${TOKEN}`;
    
    const response = await axios.get(url);
    
    return response.data;
  } catch (error) {
    logger.error('Error getting instance status:', error.response?.data || error.message);
    return { status: 'error', error: error.message };
  }
};

/**
 * Set webhook URL
 */
export const setWebhook = async (webhookUrl) => {
  if (!INSTANCE_ID || !TOKEN) {
    logger.warn('WhatsApp not configured');
    return null;
  }

  try {
    const url = `${GREEN_API_URL}/waInstance${INSTANCE_ID}/setSettings/${TOKEN}`;
    
    const response = await axios.post(url, {
      webhookUrl: webhookUrl,
      webhookUrlToken: '',
      outgoingWebhook: 'yes',
      incomingWebhook: 'yes'
    });

    logger.info(`Webhook set to: ${webhookUrl}`);
    return response.data;
  } catch (error) {
    logger.error('Error setting webhook:', error.response?.data || error.message);
    throw error;
  }
};

export default {
  sendWhatsAppMessage,
  sendWhatsAppFile,
  downloadWhatsAppFile,
  getInstanceStatus,
  setWebhook
};

