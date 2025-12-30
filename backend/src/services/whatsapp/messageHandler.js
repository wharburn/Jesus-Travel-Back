import Enquiry from '../../models/Enquiry.js';
import logger from '../../utils/logger.js';
import { processWithAI } from '../ai/openrouter.js';
import { sendWhatsAppMessage } from './client.js';

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

    // Check if this is from the pricing team submitting a quote
    const pricingTeamPhone = process.env.PRICING_TEAM_PHONE?.replace(/[+\s]/g, '');
    if (pricingTeamPhone && phoneNumber === pricingTeamPhone) {
      // Method 1: Full format with reference number
      const fullQuoteMatch = text.match(/QUOTE\s+(JT-\d{4}-\d{6})\s+£?(\d+(?:\.\d{2})?)/i);
      if (fullQuoteMatch) {
        await handlePricingTeamQuote(fullQuoteMatch[1], parseFloat(fullQuoteMatch[2]), text);
        return;
      }

      // Method 2: Simple price reply (just the number)
      const simplePriceMatch = text.match(/^£?(\d+(?:\.\d{2})?)(?:\s+(.+))?$/);
      if (simplePriceMatch) {
        const price = parseFloat(simplePriceMatch[1]);
        const notes = simplePriceMatch[2] || '';
        await handleSimplePriceQuote(formattedPhone, price, notes);
        return;
      }
    }

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
      customerName: senderName,
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
        source: 'whatsapp',
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
        // Message 1: Enquiry details
        await sendWhatsAppMessage(
          pricingTeamPhone,
          `🆕 New Booking Enquiry\n\n` +
            `Ref: ${enquiry.referenceNumber}\n` +
            `Customer: ${enquiry.customerName}\n` +
            `Phone: ${enquiry.customerPhone}\n` +
            `From: ${enquiry.pickupLocation}\n` +
            `To: ${enquiry.dropoffLocation}\n` +
            `Date: ${enquiry.pickupDate} at ${enquiry.pickupTime}\n` +
            `Passengers: ${enquiry.passengers}\n` +
            `Vehicle: ${enquiry.vehicleType}\n` +
            `${enquiry.specialRequests ? `Notes: ${enquiry.specialRequests}\n` : ''}`
        );

        // Message 2: Copyable quote template (sent separately so it's easy to copy/paste)
        await sendWhatsAppMessage(
          pricingTeamPhone,
          `📝 Copy this and add your price:\n\n` + `QUOTE ${enquiry.referenceNumber} £`
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
  const helpMessage =
    `🚗 JT Chauffeur Services - Help\n\n` +
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

/**
 * Handle simple price quote (just a number reply)
 */
const handleSimplePriceQuote = async (pricingTeamPhone, price, notes) => {
  try {
    logger.info(`Simple price quote received: £${price}`);

    // Find the most recent pending_quote enquiry
    const allEnquiries = await Enquiry.findAll();
    const pendingEnquiries = allEnquiries
      .filter((e) => e.status === 'pending_quote')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (pendingEnquiries.length === 0) {
      await sendWhatsAppMessage(
        pricingTeamPhone,
        `❌ No pending enquiries found.\n\nPlease use the full format:\nQUOTE JT-2025-XXXXXX £${price}`
      );
      return;
    }

    const enquiry = pendingEnquiries[0];

    // Calculate quote validity (48 hours from now)
    const quoteValidUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // Update enquiry with quote
    await enquiry.update({
      status: 'quoted',
      quotedPrice: price,
      quotedBy: 'pricing-team',
      quotedAt: new Date().toISOString(),
      quoteBreakdown: notes || null,
      quoteValidUntil,
    });

    logger.info(`Quote submitted for ${enquiry.referenceNumber}: £${price}`);

    // Confirm to pricing team
    await sendWhatsAppMessage(
      pricingTeamPhone,
      `✅ Quote submitted successfully!\n\n` +
        `Ref: ${enquiry.referenceNumber}\n` +
        `Customer: ${enquiry.customerName}\n` +
        `Price: £${price}\n` +
        `${notes ? `Notes: ${notes}\n` : ''}` +
        `\nThe customer will receive the quote now.`
    );

    // Send quote to customer
    const customerMessage =
      `✅ Quote Ready - ${enquiry.referenceNumber}\n\n` +
      `Dear ${enquiry.customerName},\n\n` +
      `Thank you for your enquiry. Here's your quote:\n\n` +
      `📍 From: ${enquiry.pickupLocation}\n` +
      `📍 To: ${enquiry.dropoffLocation}\n` +
      `📅 Date: ${enquiry.pickupDate} at ${enquiry.pickupTime}\n` +
      `🚗 Vehicle: ${enquiry.vehicleType}\n` +
      `👥 Passengers: ${enquiry.passengers}\n\n` +
      `💰 Total Price: £${price}\n` +
      `${notes ? `\n📝 Notes: ${notes}\n` : ''}` +
      `\nThis quote is valid until ${new Date(quoteValidUntil).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}\n\n` +
      `Reply "YES" to confirm your booking or contact us for any questions.`;

    // Log the quote message prominently
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('📤 QUOTE TO SEND TO CUSTOMER:');
    logger.info(`📞 Phone: ${enquiry.customerPhone}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(customerMessage);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      await sendWhatsAppMessage(enquiry.customerPhone, customerMessage);
      logger.info(`✅ Quote sent via WhatsApp to ${enquiry.customerPhone}`);
    } catch (error) {
      logger.warn(
        `⚠️ Failed to send quote via WhatsApp to ${enquiry.customerPhone}:`,
        error.message
      );
      logger.warn('💡 Please send the quote manually via SMS/WhatsApp using the message above');
    }
  } catch (error) {
    logger.error('Error handling simple price quote:', error);
    await sendWhatsAppMessage(pricingTeamPhone, `❌ Error processing quote: ${error.message}`);
  }
};

/**
 * Handle quote submission from pricing team via WhatsApp (full format)
 */
const handlePricingTeamQuote = async (referenceNumber, price, fullMessage) => {
  try {
    logger.info(`Pricing team quote received for ${referenceNumber}: £${price}`);

    // Find the enquiry by reference number
    const enquiry = await Enquiry.findByReference(referenceNumber);

    if (!enquiry) {
      await sendWhatsAppMessage(
        process.env.PRICING_TEAM_PHONE,
        `❌ Error: Enquiry ${referenceNumber} not found. Please check the reference number.`
      );
      return;
    }

    if (enquiry.status !== 'pending_quote') {
      await sendWhatsAppMessage(
        process.env.PRICING_TEAM_PHONE,
        `⚠️ Warning: Enquiry ${referenceNumber} already has status "${enquiry.status}". Quote not updated.`
      );
      return;
    }

    // Extract optional notes from the message (everything after the price)
    const notesMatch = fullMessage.match(/QUOTE\s+JT-\d{4}-\d{6}\s+£?\d+(?:\.\d{2})?\s+(.+)/is);
    const notes = notesMatch ? notesMatch[1].trim() : '';

    // Calculate quote validity (48 hours from now)
    const quoteValidUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // Update enquiry with quote
    await enquiry.update({
      status: 'quoted',
      quotedPrice: price,
      quotedBy: 'pricing-team',
      quotedAt: new Date().toISOString(),
      quoteBreakdown: notes || null,
      quoteValidUntil,
    });

    logger.info(`Quote submitted for ${referenceNumber}: £${price}`);

    // Confirm to pricing team
    await sendWhatsAppMessage(
      process.env.PRICING_TEAM_PHONE,
      `✅ Quote submitted successfully!\n\n` +
        `Ref: ${referenceNumber}\n` +
        `Price: £${price}\n` +
        `Customer: ${enquiry.customerName}\n\n` +
        `The customer will receive the quote now.`
    );

    // Send quote to customer
    const customerMessage =
      `✅ Quote Ready - ${referenceNumber}\n\n` +
      `Dear ${enquiry.customerName},\n\n` +
      `Thank you for your enquiry. Here's your quote:\n\n` +
      `📍 From: ${enquiry.pickupLocation}\n` +
      `📍 To: ${enquiry.dropoffLocation}\n` +
      `📅 Date: ${enquiry.pickupDate} at ${enquiry.pickupTime}\n` +
      `🚗 Vehicle: ${enquiry.vehicleType}\n` +
      `👥 Passengers: ${enquiry.passengers}\n\n` +
      `💰 Total Price: £${price}\n` +
      `${notes ? `\n📝 Notes: ${notes}\n` : ''}` +
      `\nThis quote is valid until ${new Date(quoteValidUntil).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}\n\n` +
      `Reply "YES" to confirm your booking or contact us for any questions.`;

    await sendWhatsAppMessage(enquiry.customerPhone, customerMessage);

    logger.info(`Quote sent to customer ${enquiry.customerPhone}`);
  } catch (error) {
    logger.error('Error handling pricing team quote:', error);
    await sendWhatsAppMessage(
      process.env.PRICING_TEAM_PHONE,
      `❌ Error processing quote: ${error.message}`
    );
  }
};

export default {
  processWhatsAppMessage,
};
