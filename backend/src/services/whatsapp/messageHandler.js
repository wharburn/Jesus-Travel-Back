import logger from '../../utils/logger.js';
import { sendWhatsAppMessage } from './client.js';
import { processWithAI } from '../ai/openrouter.js';
import Enquiry from '../../models/Enquiry.js';

/**
 * Process incoming WhatsApp message
 */
export const processWhatsAppMessage = async (message) => {
  try {
    const { text, sender, senderName } = message;
    
    logger.info(`Processing message from ${senderName} (${sender}): ${text}`);

    // Extract phone number from sender (remove @c.us)
    const phoneNumber = sender.replace('@c.us', '');
    const formattedPhone = `+${phoneNumber}`;

    // Check for simple commands first
    if (text.toLowerCase() === 'help') {
      await sendHelpMessage(formattedPhone);
      return;
    }

    // Check if this is a quote acceptance
    if (text.toLowerCase() === 'yes' || text.toLowerCase() === 'confirm') {
      await handleQuoteAcceptance(formattedPhone);
      return;
    }

    // Check if this is a quote rejection
    if (text.toLowerCase() === 'no' || text.toLowerCase() === 'cancel') {
      await handleQuoteRejection(formattedPhone);
      return;
    }

    // Process with AI for booking enquiries
    const aiResponse = await processWithAI(text, {
      customerPhone: formattedPhone,
      customerName: senderName
    });

    // Send AI response
    if (aiResponse.message) {
      await sendWhatsAppMessage(formattedPhone, aiResponse.message);
    }

    // If AI extracted complete booking information, create enquiry
    if (aiResponse.createEnquiry && aiResponse.enquiryData) {
      const enquiryData = {
        ...aiResponse.enquiryData,
        customerPhone: formattedPhone,
        customerName: senderName,
        source: 'whatsapp'
      };

      const enquiry = new Enquiry(enquiryData);
      await enquiry.save();

      logger.info(`Enquiry created from WhatsApp: ${enquiry.referenceNumber}`);

      // Notify customer
      await sendWhatsAppMessage(
        formattedPhone,
        `✅ Your booking request has been received!\n\n` +
        `Reference: ${enquiry.referenceNumber}\n\n` +
        `Our team will review your request and send you a quote shortly. Thank you!`
      );

      // Notify pricing team
      const pricingTeamPhone = process.env.PRICING_TEAM_PHONE;
      if (pricingTeamPhone) {
        await sendWhatsAppMessage(
          pricingTeamPhone,
          `🆕 New Booking Enquiry\n\n` +
          `Ref: ${enquiry.referenceNumber}\n` +
          `Customer: ${enquiry.customerName}\n` +
          `From: ${enquiry.pickupLocation}\n` +
          `To: ${enquiry.dropoffLocation}\n` +
          `Date: ${enquiry.pickupDate} at ${enquiry.pickupTime}\n` +
          `Passengers: ${enquiry.passengers}\n` +
          `Vehicle: ${enquiry.vehicleType}\n` +
          `${enquiry.specialRequests ? `Notes: ${enquiry.specialRequests}\n` : ''}` +
          `\nPlease review and submit a quote.`
        );
      }
    }
  } catch (error) {
    logger.error('Error processing WhatsApp message:', error);
    
    // Send error message to user
    try {
      const phoneNumber = message.sender.replace('@c.us', '');
      await sendWhatsAppMessage(
        `+${phoneNumber}`,
        'Sorry, I encountered an error processing your message. Please try again or contact our support team.'
      );
    } catch (sendError) {
      logger.error('Error sending error message:', sendError);
    }
  }
};

const sendHelpMessage = async (phoneNumber) => {
  const helpMessage = `🚗 JT Chauffeur Services - Help\n\n` +
    `I can help you book a chauffeur service!\n\n` +
    `Just tell me:\n` +
    `• Where you need to be picked up\n` +
    `• Where you're going\n` +
    `• Date and time\n` +
    `• Number of passengers\n\n` +
    `Example: "I need a ride from Heathrow to London tomorrow at 2pm for 2 passengers"\n\n` +
    `Or simply start chatting and I'll guide you through the booking process!`;

  await sendWhatsAppMessage(phoneNumber, helpMessage);
};

const handleQuoteAcceptance = async (phoneNumber) => {
  // Find most recent quoted enquiry for this customer
  // TODO: Implement proper quote acceptance logic
  await sendWhatsAppMessage(
    phoneNumber,
    'Thank you for accepting! Your booking is being confirmed. You will receive confirmation shortly.'
  );
};

const handleQuoteRejection = async (phoneNumber) => {
  await sendWhatsAppMessage(
    phoneNumber,
    'Thank you for letting us know. If you have any questions or would like to discuss the quote, please feel free to contact us.'
  );
};

export default {
  processWhatsAppMessage
};

