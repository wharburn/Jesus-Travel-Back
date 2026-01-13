/**
 * Quick test script to verify AI estimate calculation
 * Run with: node test-ai-estimate.js
 */

import 'dotenv/config';
import { calculateQuote } from './src/services/pricing/pricingEngine.js';

async function testAIEstimate() {
  console.log('🧪 Testing AI Estimate Calculation\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`   GOOGLE_MAPS_API_KEY: ${process.env.GOOGLE_MAPS_API_KEY ? '✅ Set (' + process.env.GOOGLE_MAPS_API_KEY.substring(0, 10) + '...)' : '❌ Not set'}`);
  console.log(`   UPSTASH_REDIS_REST_URL: ${process.env.UPSTASH_REDIS_REST_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`   OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test data
  const testBooking = {
    pickupAddress: 'Heathrow Airport, London',
    dropoffAddress: '10 Downing Street, London',
    pickupDatetime: new Date().toISOString(),
    vehicleType: 'Standard Sedan',
    passengers: 2,
  };

  console.log('🚗 Test Booking:');
  console.log(`   Pickup: ${testBooking.pickupAddress}`);
  console.log(`   Dropoff: ${testBooking.dropoffAddress}`);
  console.log(`   Vehicle: ${testBooking.vehicleType}`);
  console.log(`   Passengers: ${testBooking.passengers}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    console.log('⏳ Calculating quote...\n');

    const quote = await calculateQuote(testBooking);

    console.log('✅ SUCCESS! AI Estimate Calculated:\n');
    console.log(`   💰 Total Price: £${quote.pricing.total_amount}`);
    console.log(`   📏 Distance: ${quote.distance.text}`);
    console.log(`   ⏱️  Duration: ${quote.duration.text}`);
    console.log(`   ⏰ Time Multiplier: ${quote.pricing.time_multiplier_name}`);
    console.log(`\n   Breakdown:`);
    console.log(`      Base Fare: £${quote.pricing.base_fare}`);
    console.log(`      Distance Charge: £${quote.pricing.distance_charge}`);
    console.log(`      Zone Charges: £${quote.pricing.zone_charges}`);

    if (quote.zones && quote.zones.length > 0) {
      console.log(`\n   📍 Zones: ${quote.zones.map((z) => z.zone_name).join(', ')}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Test PASSED - AI estimate is working correctly!\n');
    process.exit(0);
  } catch (error) {
    console.log('❌ FAILED! Error calculating AI estimate:\n');
    console.error(`   Error: ${error.message}`);
    
    if (error.stack) {
      console.log('\n   Stack trace:');
      console.log(error.stack.split('\n').slice(0, 5).map(line => '   ' + line).join('\n'));
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Troubleshooting Tips:\n');

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.log('   ⚠️  GOOGLE_MAPS_API_KEY is not set in your .env file');
      console.log('   → Add: GOOGLE_MAPS_API_KEY=your-api-key-here\n');
    }

    if (error.message.includes('REQUEST_DENIED')) {
      console.log('   ⚠️  Google Maps API request was denied');
      console.log('   → Check your API key is valid');
      console.log('   → Verify billing is enabled in Google Cloud Console');
      console.log('   → Check API restrictions (should allow Distance Matrix & Geocoding APIs)\n');
    }

    if (error.message.includes('OVER_QUERY_LIMIT')) {
      console.log('   ⚠️  Google Maps API quota exceeded');
      console.log('   → Wait for quota to reset (monthly)');
      console.log('   → Or enable billing to increase quota\n');
    }

    if (!process.env.UPSTASH_REDIS_REST_URL) {
      console.log('   ⚠️  UPSTASH_REDIS_REST_URL is not set in your .env file');
      console.log('   → Add: UPSTASH_REDIS_REST_URL=your-redis-url\n');
    }

    console.log('   📖 See TROUBLESHOOTING_AI_ESTIMATE.md for more help\n');
    process.exit(1);
  }
}

// Run the test
testAIEstimate();

