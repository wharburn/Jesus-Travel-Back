import redisClient from './src/config/redis.js';
import logger from './src/utils/logger.js';

async function clearRedis() {
  try {
    logger.info('Clearing Redis database...');
    
    // Get all enquiry keys
    const enquiryKeys = await redisClient.keys('enquiry:*');
    const refKeys = await redisClient.keys('enquiry:ref:*');
    
    logger.info(`Found ${enquiryKeys.length} enquiry keys and ${refKeys.length} reference keys`);
    
    // Delete all enquiry-related keys
    if (enquiryKeys.length > 0) {
      await redisClient.del(...enquiryKeys);
    }
    
    if (refKeys.length > 0) {
      await redisClient.del(...refKeys);
    }
    
    // Clear sorted sets
    await redisClient.del('enquiries:all');
    await redisClient.del('enquiries:status:pending_quote');
    await redisClient.del('enquiries:status:quoted');
    await redisClient.del('enquiries:status:confirmed');
    await redisClient.del('enquiries:status:cancelled');
    
    logger.info('✅ Redis database cleared successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error clearing Redis:', error);
    process.exit(1);
  }
}

clearRedis();

