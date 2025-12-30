import { enquiryIndex } from '../config/search.js';
import logger from '../utils/logger.js';

/**
 * Index an enquiry in Upstash Search
 * @param {Object} enquiry - The enquiry object to index
 */
export const indexEnquiry = async (enquiry) => {
  if (!enquiryIndex) {
    logger.warn('Search index not available - skipping indexing');
    return;
  }

  try {
    // Create searchable content from enquiry data
    const content = {
      text: [
        enquiry.customerName,
        enquiry.email,
        enquiry.phone,
        enquiry.pickupLocation,
        enquiry.dropoffLocation,
        enquiry.tripType,
        enquiry.vehicleType,
        enquiry.referenceNumber,
        enquiry.notes,
      ]
        .filter(Boolean)
        .join(' '),
    };

    // Create metadata for filtering
    const metadata = {
      referenceNumber: enquiry.referenceNumber,
      customerName: enquiry.customerName,
      email: enquiry.email,
      phone: enquiry.phone,
      pickupLocation: enquiry.pickupLocation,
      dropoffLocation: enquiry.dropoffLocation,
      tripType: enquiry.tripType,
      vehicleType: enquiry.vehicleType,
      status: enquiry.status,
      source: enquiry.source,
      createdAt: enquiry.createdAt,
    };

    // Index the document
    await enquiryIndex.upsert({
      id: enquiry.id,
      content,
      metadata,
    });

    logger.info(`✅ Indexed enquiry ${enquiry.id} in search`);
  } catch (error) {
    logger.error(`❌ Failed to index enquiry ${enquiry.id}:`, error);
    // Don't throw - indexing failure shouldn't break the main flow
  }
};

/**
 * Remove an enquiry from search index
 * @param {string} enquiryId - The enquiry ID to remove
 */
export const removeEnquiryFromIndex = async (enquiryId) => {
  if (!enquiryIndex) {
    return;
  }

  try {
    await enquiryIndex.delete([enquiryId]);
    logger.info(`✅ Removed enquiry ${enquiryId} from search index`);
  } catch (error) {
    logger.error(`❌ Failed to remove enquiry ${enquiryId} from index:`, error);
  }
};

/**
 * Search enquiries
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Search results
 */
export const searchEnquiries = async (query, options = {}) => {
  if (!enquiryIndex) {
    throw new Error('Search is not available');
  }

  try {
    const { limit = 10, filter } = options;

    // Perform search
    const results = await enquiryIndex.search({
      query,
      limit,
      filter,
    });

    logger.info(`🔍 Search for "${query}" returned ${results.length} results`);
    return results;
  } catch (error) {
    logger.error('❌ Search failed:', error);
    throw error;
  }
};

/**
 * Check if search is available
 * @returns {boolean}
 */
export const isSearchAvailable = () => {
  return enquiryIndex !== null;
};
