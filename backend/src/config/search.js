import { Search } from '@upstash/search';
import logger from '../utils/logger.js';

let searchClient = null;
let enquiryIndex = null;

try {
  if (!process.env.UPSTASH_SEARCH_REST_URL || !process.env.UPSTASH_SEARCH_REST_TOKEN) {
    logger.warn('⚠️  Upstash Search credentials not found - search features will be disabled');
  } else {
    searchClient = new Search({
      url: process.env.UPSTASH_SEARCH_REST_URL,
      token: process.env.UPSTASH_SEARCH_REST_TOKEN,
    });

    // Create an index for enquiries
    enquiryIndex = searchClient.index('enquiries');

    logger.info('✅ Upstash Search client initialized');
  }
} catch (error) {
  logger.error('❌ Failed to initialize Upstash Search client:', error);
}

export { enquiryIndex, searchClient };
export default searchClient;
