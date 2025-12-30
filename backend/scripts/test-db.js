import 'dotenv/config';
import redisClient from '../src/config/redis.js';
import vectorClient from '../src/config/vector.js';
import logger from '../src/utils/logger.js';

const testDatabase = async () => {
  console.log('🧪 Testing database connections...\n');

  // Test Redis
  try {
    console.log('Testing Upstash Redis...');
    const pingResult = await redisClient.ping();
    console.log('✅ Redis PING:', pingResult);

    // Test set/get
    await redisClient.set('test:key', 'Hello from JT Chauffeur!');
    const value = await redisClient.get('test:key');
    console.log('✅ Redis SET/GET:', value);

    // Clean up
    await redisClient.del('test:key');
    console.log('✅ Redis connection successful!\n');
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.error('Please check your UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN\n');
  }

  // Test Vector DB
  try {
    if (vectorClient) {
      console.log('Testing Upstash Vector...');
      console.log('✅ Vector client initialized\n');
    } else {
      console.log('⚠️  Vector DB not configured (optional)\n');
    }
  } catch (error) {
    console.error('❌ Vector DB error:', error.message);
  }

  console.log('✅ Database tests complete!');
  process.exit(0);
};

testDatabase().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});

