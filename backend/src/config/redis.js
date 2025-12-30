import { Redis } from '@upstash/redis';
import logger from '../utils/logger.js';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  logger.error('Missing Upstash Redis credentials in environment variables');
  throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
}

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

// Test connection
redisClient.ping()
  .then(() => {
    logger.info('✅ Connected to Upstash Redis');
  })
  .catch((error) => {
    logger.error('❌ Failed to connect to Upstash Redis:', error);
  });

export default redisClient;

