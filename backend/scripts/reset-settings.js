import { Redis } from '@upstash/redis';
import 'dotenv/config';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const SETTINGS_KEY = 'jt:settings';

const defaultSettings = {
  business: {
    name: 'JT Chauffeur Services',
    phone: '+44 7700 900123',
    email: 'info@jesus-travel.com',
    whatsapp: '+44 7700 900123',
  },
  pricingTeam: {
    phone: '+44 7700 900456',
    email: 'pricing@jesus-travel.com',
  },
  quotes: {
    validityDays: 2,
    autoSendToCustomer: true,
    autoQuoteMode: false, // Default to manual mode for safety
  },
  notifications: {
    whatsapp: {
      enabled: true,
      notifyCustomer: true,
      notifyPricingTeam: true,
    },
    email: {
      enabled: false,
      notifyCustomer: false,
      notifyPricingTeam: false,
    },
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
