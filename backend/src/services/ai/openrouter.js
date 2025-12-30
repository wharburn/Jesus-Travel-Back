import axios from 'axios';
import logger from '../../utils/logger.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

if (!OPENROUTER_API_KEY) {
  logger.warn('OpenRouter API key not configured - AI features will be disabled');
}

const SYSTEM_PROMPT = `You are a helpful AI assistant for JT Chauffeur Services, a luxury chauffeur booking service.

Your role is to:
1. Help customers book chauffeur services by collecting necessary information
2. Be friendly, professional, and concise
3. Extract booking details from natural language

Required booking information:
- Pickup location
- Dropoff location
- Pickup date
- Pickup time
- Number of passengers
- Vehicle type (Saloon, SUV, MPV, Minibus)
- Special requests (optional)

When you have ALL required information, respond with a JSON object in this format:
{
  "message": "Your response to the customer",
  "createEnquiry": true,
  "enquiryData": {
    "pickupLocation": "...",
    "dropoffLocation": "...",
    "pickupDate": "YYYY-MM-DD",
    "pickupTime": "HH:MM",
    "passengers": number,
    "vehicleType": "...",
    "specialRequests": "..."
  }
}

If you don't have all information yet, just respond with:
{
  "message": "Your question to gather more information",
  "createEnquiry": false
}

Be conversational and natural. Don't ask for all information at once.`;

/**
 * Process message with AI
 */
export const processWithAI = async (userMessage, context = {}) => {
  if (!OPENROUTER_API_KEY) {
    logger.warn('AI not configured, using fallback response');
    return {
      message: 'Thank you for your message. Our team will get back to you shortly.',
      createEnquiry: false
    };
  }

  try {
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: OPENROUTER_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'JT Chauffeur Services'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    
    logger.info('AI Response:', aiResponse);

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(aiResponse);
      return parsed;
    } catch (parseError) {
      // If not JSON, return as plain message
      return {
        message: aiResponse,
        createEnquiry: false
      };
    }
  } catch (error) {
    logger.error('OpenRouter API error:', error.response?.data || error.message);
    
    return {
      message: 'I apologize, but I\'m having trouble processing your request right now. Please try again or contact our support team.',
      createEnquiry: false
    };
  }
};

/**
 * Extract booking information from text
 */
export const extractBookingInfo = async (text) => {
  if (!OPENROUTER_API_KEY) {
    return null;
  }

  const extractionPrompt = `Extract booking information from this text and return ONLY a JSON object with these fields (use null if not found):
{
  "pickupLocation": "...",
  "dropoffLocation": "...",
  "pickupDate": "YYYY-MM-DD",
  "pickupTime": "HH:MM",
  "passengers": number,
  "vehicleType": "...",
  "specialRequests": "..."
}

Text: ${text}`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'user', content: extractionPrompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const extracted = JSON.parse(response.data.choices[0].message.content);
    return extracted;
  } catch (error) {
    logger.error('Error extracting booking info:', error);
    return null;
  }
};

export default {
  processWithAI,
  extractBookingInfo
};

