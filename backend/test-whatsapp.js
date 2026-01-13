/**
 * Test WhatsApp integration
 * Run with: node test-whatsapp.js
 */

import 'dotenv/config';
import { sendWhatsAppMessage, getInstanceStatus } from './src/services/whatsapp/client.js';

async function testWhatsApp() {
  console.log('🧪 Testing WhatsApp Integration\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`   GREEN_API_INSTANCE_ID: ${process.env.GREEN_API_INSTANCE_ID ? '✅ Set (' + process.env.GREEN_API_INSTANCE_ID + ')' : '❌ Not set'}`);
  console.log(`   GREEN_API_TOKEN: ${process.env.GREEN_API_TOKEN ? '✅ Set (' + process.env.GREEN_API_TOKEN.substring(0, 10) + '...)' : '❌ Not set'}`);
  console.log(`   PRICING_TEAM_PHONE: ${process.env.PRICING_TEAM_PHONE ? '✅ Set (' + process.env.PRICING_TEAM_PHONE + ')' : '❌ Not set'}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!process.env.GREEN_API_INSTANCE_ID || !process.env.GREEN_API_TOKEN) {
    console.log('❌ FAILED: GREEN_API credentials not configured\n');
    console.log('💡 Add these to your .env file:');
    console.log('   GREEN_API_INSTANCE_ID=your-instance-id');
    console.log('   GREEN_API_TOKEN=your-token\n');
    process.exit(1);
  }

  // Test 1: Check instance status
  console.log('🔍 Test 1: Checking WhatsApp Instance Status...\n');
  try {
    const status = await getInstanceStatus();
    console.log('   Instance Status:', JSON.stringify(status, null, 2));
    
    if (status.stateInstance === 'authorized') {
      console.log('   ✅ WhatsApp instance is authorized and ready!\n');
    } else if (status.stateInstance === 'notAuthorized') {
      console.log('   ❌ WhatsApp instance is NOT authorized');
      console.log('   💡 You need to scan the QR code in Green API dashboard\n');
      process.exit(1);
    } else {
      console.log(`   ⚠️  Instance state: ${status.stateInstance}\n`);
    }
  } catch (error) {
    console.log('   ❌ Failed to get instance status:', error.message);
    console.log('   💡 Check your GREEN_API credentials\n');
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 2: Send test message
  if (!process.env.PRICING_TEAM_PHONE) {
    console.log('⚠️  PRICING_TEAM_PHONE not set, skipping message test\n');
    process.exit(0);
  }

  console.log('📤 Test 2: Sending Test Message...\n');
  console.log(`   To: ${process.env.PRICING_TEAM_PHONE}\n`);

  const testMessage = 
    `🧪 WhatsApp Test Message\n\n` +
    `This is a test message from your JT Chauffeur backend.\n\n` +
    `✅ If you receive this, WhatsApp integration is working!\n\n` +
    `Timestamp: ${new Date().toISOString()}`;

  try {
    const result = await sendWhatsAppMessage(process.env.PRICING_TEAM_PHONE, testMessage);
    
    console.log('   ✅ Message sent successfully!\n');
    console.log('   Response:', JSON.stringify(result, null, 2));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ WhatsApp integration is working!\n');
    console.log('💡 Check your phone to confirm you received the message.\n');
    process.exit(0);
  } catch (error) {
    console.log('   ❌ Failed to send message\n');
    console.log('   Error:', error.message);
    
    if (error.response) {
      console.log('   API Response:', JSON.stringify(error.response.data, null, 2));
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Troubleshooting Tips:\n');
    console.log('   1. Check that your WhatsApp instance is authorized');
    console.log('      → Go to https://console.green-api.com/');
    console.log('      → Check instance status');
    console.log('      → Scan QR code if needed\n');
    console.log('   2. Verify your phone number format');
    console.log('      → Should be: +447822027794 (with country code)\n');
    console.log('   3. Check Green API account status');
    console.log('      → Make sure you have credits/active subscription\n');
    console.log('   4. Check API credentials');
    console.log('      → INSTANCE_ID and TOKEN must match your Green API account\n');
    
    process.exit(1);
  }
}

// Run the test
testWhatsApp();

