import { Index } from '@upstash/vector';
import logger from '../utils/logger.js';

if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
  logger.warn('Missing Upstash Vector credentials - vector search will be disabled');
}

let vectorClient = null;

if (process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN) {
  vectorClient = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN
  });

  logger.info('✅ Upstash Vector client initialized');
}

export default vectorClient;

