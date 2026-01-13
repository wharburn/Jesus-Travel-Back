import { Redis } from '@upstash/redis';
import 'dotenv/config';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const SETTINGS_KEY = 'jt:settings';

const defaultSettings = {
  business: {
    name: process.env.BUSINESS_NAME || 'JT Chauffeur Services',
    phone: process.env.BUSINESS_PHONE || '+447700900000',
    email: process.env.BUSINESS_EMAIL || 'bookings@jtchauffeur.com',
    whatsapp: process.env.BUSINESS_WHATSAPP || '+447700900000',
  },
  pricingTeam: {
    phone: process.env.PRICING_TEAM_PHONE || '+447822027794',
    email: process.env.PRICING_TEAM_EMAIL || 'pricing@jtchauffeur.com',
  },
  whatsapp: {
    instanceId: process.env.GREEN_API_INSTANCE_ID || '',
    enabled: !!process.env.GREEN_API_INSTANCE_ID && !!process.env.GREEN_API_TOKEN,
  },
  ai: {
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
    enabled: !!process.env.OPENROUTER_API_KEY,
  },
  quotes: {
    validityDays: 2,
    autoSendToCustomer: true,
    requireApproval: false,
    autoQuoteMode: process.env.AUTO_QUOTE_MODE === 'true' || false,
  },
  notifications: {
    emailEnabled: true,
    whatsappEnabled: true,
    smsEnabled: false,
  },
};

async function resetSettings() {
  try {
    console.log('🔄 Resetting settings in Redis...');

    // Delete the corrupted settings
    await redis.del(SETTINGS_KEY);
    console.log('✅ Deleted old settings');

    // Set new default settings (Upstash automatically serializes objects)
    await redis.set(SETTINGS_KEY, defaultSettings);
    console.log('✅ Initialized default settings');

    // Verify (Upstash automatically deserializes)
    const settings = await redis.get(SETTINGS_KEY);

    console.log('\n📋 Current settings:');
    console.log(JSON.stringify(settings, null, 2));

    console.log('\n✅ Settings reset successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting settings:', error);
    process.exit(1);
  }
}

resetSettings();
