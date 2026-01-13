import Enquiry from '../../models/Enquiry.js';
import logger from '../../utils/logger.js';
import { getSetting } from '../../utils/settings.js';
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
    const pricingTeamPhoneFromSettings = await getSetting('pricingTeam.phone');
    const pricingTeamPhone = (
      pricingTeamPhoneFromSettings || process.env.PRICING_TEAM_PHONE
    )?.replace(/[+\s]/g, '');

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🔍 PRICING TEAM CHECK');
    logger.info(`Sender phone: ${phoneNumber}`);
    logger.info(`Pricing team phone: ${pricingTeamPhone || 'NOT SET'}`);
    logger.info(`Match: ${pricingTeamPhone && phoneNumber === pricingTeamPhone ? 'YES' : 'NO'}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (pricingTeamPhone && phoneNumber === pricingTeamPhone) {
      // Method 1: Full format with reference number
      const fullQuoteMatch = text.match(/QUOTE\s+(JT-\d{4}-\d{6})\s+£?(\d+(?:\.\d{2})?)/i);
      if (fullQuoteMatch) {
        await handlePricingTeamQuote(fullQuoteMatch[1], parseFloat(fullQuoteMatch[2]), text);
        return;
      }

      // Method 2: Short format with 3-digit job number (e.g., "001 85", "002 OK", "003 95 +MG")
      const shortFormatMatch = text.match(
        /^(\d{3})\s+(OK|✓|✅|APPROVE|ACCEPT|£?(\d+(?:\.\d{2})?)(?:\s+(.+))?)$/i
      );
      if (shortFormatMatch) {
        const jobNumber = shortFormatMatch[1];
        const action = shortFormatMatch[2];

        // Check if it's "OK" or a price
        if (action.match(/^(OK|✓|✅|APPROVE|ACCEPT)$/i)) {
          await handleShortApprove(formattedPhone, jobNumber);
        } else {
          const priceMatch = action.match(/^£?(\d+(?:\.\d{2})?)(?:\s+(.+))?$/);
          if (priceMatch) {
            const price = parseFloat(priceMatch[1]);
            const notes = priceMatch[2] || '';
            await handleShortQuote(formattedPhone, jobNumber, price, notes);
          }
        }
        return;
      }

      // Check how many pending enquiries exist for fallback methods
      const allEnquiries = await Enquiry.findAll();
      const pendingCount = allEnquiries.filter((e) => e.status === 'pending_quote').length;

      // Method 3: Quick approve AI estimate (OK only - when single pending)
      if (text.match(/^(OK|✓|✅|APPROVE|ACCEPT|YES)$/i)) {
        if (pendingCount > 1) {
          await sendWhatsAppMessage(
            formattedPhone,
            `⚠️ Multiple pending enquiries (${pendingCount}).\n\nPlease use: [JOB#] OK\nExample: 001 OK`
          );
          return;
        }
        await handleQuickApprove(formattedPhone);
        return;
      }

      // Method 4: Simple price reply (just the number - when single pending)
      const simplePriceMatch = text.match(/^£?(\d+(?:\.\d{2})?)(?:\s+(.+))?$/);
      if (simplePriceMatch) {
        if (pendingCount > 1) {
          await sendWhatsAppMessage(
            formattedPhone,
            `⚠️ Multiple pending enquiries (${pendingCount}).\n\nPlease use: [JOB#] £[PRICE]\nExample: 001 ${simplePriceMatch[1]}`
          );
          return;
        }
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

/**
 * Handle short format approve (e.g., "001 OK")
 */
const handleShortApprove = async (pricingTeamPhone, jobNumber) => {
  try {
    logger.info(`Short approve received: Job ${jobNumber}`);

    // Find enquiry by job number (last 3 digits of reference)
    const allEnquiries = await Enquiry.findAll();
    const enquiry = allEnquiries.find((e) => e.referenceNumber.endsWith(jobNumber));

    if (!enquiry) {
      await sendWhatsAppMessage(
        pricingTeamPhone,
        `❌ Job ${jobNumber} not found.\n\nCheck the reference number and try again.`
      );
      return;
    }

    // Check if enquiry has an AI estimate stored
    if (!enquiry.aiEstimate || !enquiry.aiEstimate.totalPrice) {
      await sendWhatsAppMessage(
        pricingTeamPhone,
        `❌ No AI estimate found for ${enquiry.referenceNumber}.\n\nPlease reply with:\n${jobNumber} £[PRICE]`
      );
      return;
    }

    const price = parseFloat(enquiry.aiEstimate.totalPrice);

    // Update enquiry with quote
    const quoteValidUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    enquiry.quotedPrice = price;
    enquiry.status = 'quoted';
    enquiry.quotedAt = new Date().toISOString();
    enquiry.quotedBy = 'PRICING_TEAM';
    enquiry.quoteValidUntil = quoteValidUntil;
    await enquiry.save();

    logger.info(`✅ AI estimate approved: £${price} for ${enquiry.referenceNumber}`);

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
      `💰 Total Price: £${price}\n\n` +
      `This quote is valid until ${new Date(quoteValidUntil).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}\n\n` +
      `Reply "YES" to confirm your booking or contact us for any questions.`;

    await sendWhatsAppMessage(enquiry.customerPhone, customerMessage);

    // Confirm to pricing team
    await sendWhatsAppMessage(
      pricingTeamPhone,
      `✅ Quote sent!\n\n` +
        `Job: ${jobNumber}\n` +
        `Ref: ${enquiry.referenceNumber}\n` +
        `Price: £${price}\n` +
        `Customer notified.`
    );
  } catch (error) {
    logger.error('Error handling short approve:', error);
    await sendWhatsAppMessage(pricingTeamPhone, `❌ Error approving quote: ${error.message}`);
  }
};

/**
 * Handle short format quote (e.g., "001 85", "002 95 +MG")
 */
const handleShortQuote = async (pricingTeamPhone, jobNumber, price, notes) => {
  try {
    logger.info(`Short quote received: Job ${jobNumber}, Price £${price}, Notes: ${notes}`);

    // Find enquiry by job number (last 3 digits of reference)
    const allEnquiries = await Enquiry.findAll();
    const enquiry = allEnquiries.find((e) => e.referenceNumber.endsWith(jobNumber));

    if (!enquiry) {
      await sendWhatsAppMessage(
        pricingTeamPhone,
        `❌ Job ${jobNumber} not found.\n\nCheck the reference number and try again.`
      );
      return;
    }

    // Parse add-ons if present
    let finalNotes = notes;
    if (notes) {
      const addons = [];
      const addonMap = {
        '+MG': 'Meet & Greet',
        '+CS': 'Child Seat',
        '+BS': 'Booster Seat',
        '+WC': 'Wheelchair Accessible',
        '+LG': 'Extra Luggage',
        '+WF': 'WiFi',
        '+WA': 'Wait & Return',
      };

      Object.keys(addonMap).forEach((code) => {
        if (notes.toUpperCase().includes(code)) {
          addons.push(addonMap[code]);
        }
      });

      if (addons.length > 0) {
        finalNotes = `Includes: ${addons.join(', ')}`;
      }
    }

    // Update enquiry with quote
    const quoteValidUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    enquiry.quotedPrice = price;
    enquiry.status = 'quoted';
    enquiry.quotedAt = new Date().toISOString();
    enquiry.quotedBy = 'PRICING_TEAM';
    enquiry.quoteValidUntil = quoteValidUntil;
    await enquiry.save();

    logger.info(`✅ Quote submitted: £${price} for ${enquiry.referenceNumber}`);

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
      `${finalNotes ? `\n📝 ${finalNotes}\n` : ''}` +
      `\nThis quote is valid until ${new Date(quoteValidUntil).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}\n\n` +
      `Reply "YES" to confirm your booking or contact us for any questions.`;

    await sendWhatsAppMessage(enquiry.customerPhone, customerMessage);

    // Confirm to pricing team
    await sendWhatsAppMessage(
      pricingTeamPhone,
      `✅ Quote sent!\n\n` +
        `Job: ${jobNumber}\n` +
        `Ref: ${enquiry.referenceNumber}\n` +
        `Price: £${price}\n` +
        `${finalNotes ? `Notes: ${finalNotes}\n` : ''}` +
        `Customer notified.`
    );
  } catch (error) {
    logger.error('Error handling short quote:', error);
    await sendWhatsAppMessage(pricingTeamPhone, `❌ Error submitting quote: ${error.message}`);
  }
};

/**
 * Handle quick approve of AI estimate (OK, ✓, etc.)
 */
const handleQuickApprove = async (pricingTeamPhone) => {
  try {
    logger.info('Quick approve received from pricing team');

    // Find the most recent pending_quote enquiry
    const allEnquiries = await Enquiry.findAll();
    const pendingEnquiries = allEnquiries
      .filter((e) => e.status === 'pending_quote')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (pendingEnquiries.length === 0) {
      await sendWhatsAppMessage(pricingTeamPhone, `❌ No pending enquiries found to approve.`);
      return;
    }

    const enquiry = pendingEnquiries[0];

    // Check if enquiry has an AI estimate stored
    if (!enquiry.aiEstimate || !enquiry.aiEstimate.totalPrice) {
      await sendWhatsAppMessage(
        pricingTeamPhone,
        `❌ No AI estimate found for ${enquiry.referenceNumber}.\n\nPlease reply with a price:\nQUOTE ${enquiry.referenceNumber} £[PRICE]`
      );
      return;
    }

    const price = parseFloat(enquiry.aiEstimate.totalPrice);

    // Update enquiry with quote
    const quoteValidUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    enquiry.quotedPrice = price;
    enquiry.status = 'quoted';
    enquiry.quotedAt = new Date().toISOString();
    enquiry.quotedBy = 'PRICING_TEAM';
    enquiry.quoteValidUntil = quoteValidUntil;
    await enquiry.save();

    logger.info(`✅ AI estimate approved: £${price} for ${enquiry.referenceNumber}`);

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
      `💰 Total Price: £${price}\n\n` +
      `This quote is valid until ${new Date(quoteValidUntil).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}\n\n` +
      `Reply "YES" to confirm your booking or contact us for any questions.`;

    await sendWhatsAppMessage(enquiry.customerPhone, customerMessage);

    // Confirm to pricing team
    await sendWhatsAppMessage(
      pricingTeamPhone,
      `✅ AI estimate approved and sent!\n\n` +
        `Ref: ${enquiry.referenceNumber}\n` +
        `Price: £${price}\n` +
        `Customer has been notified.`
    );
  } catch (error) {
    logger.error('Error handling quick approve:', error);
    await sendWhatsAppMessage(pricingTeamPhone, `❌ Error approving quote: ${error.message}`);
  }
};

/**
 * Handle price with add-ons (e.g., "85 +MG +CS")
 */
const handlePriceWithAddons = async (pricingTeamPhone, price, addonsText) => {
  try {
    logger.info(`Price with add-ons received: £${price}, add-ons: ${addonsText}`);

    // Parse add-ons
    const addons = [];
    const addonMap = {
      '+MG': 'Meet & Greet',
      '+CS': 'Child Seat',
      '+BS': 'Booster Seat',
      '+WC': 'Wheelchair Accessible',
      '+LG': 'Extra Luggage',
      '+WF': 'WiFi',
      '+WA': 'Wait & Return',
    };

    let notes = '';
    Object.keys(addonMap).forEach((code) => {
      if (addonsText.toUpperCase().includes(code)) {
        addons.push(addonMap[code]);
      }
    });

    if (addons.length > 0) {
      notes = `Includes: ${addons.join(', ')}`;
    } else {
      // If no recognized add-ons, treat the whole text as notes
      notes = addonsText;
    }

    // Use the simple price quote handler with notes
    await handleSimplePriceQuote(pricingTeamPhone, price, notes);
  } catch (error) {
    logger.error('Error handling price with add-ons:', error);
    await sendWhatsAppMessage(pricingTeamPhone, `❌ Error processing quote: ${error.message}`);
  }
};

export default {
  processWhatsAppMessage,
};
