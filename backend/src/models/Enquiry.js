import { v4 as uuidv4 } from 'uuid';
import redisClient from '../config/redis.js';
import { indexEnquiry, removeEnquiryFromIndex } from '../services/searchService.js';
import logger from '../utils/logger.js';

// In-memory fallback storage for development when Redis is unavailable
const inMemoryStorage = {
  enquiries: new Map(),
  refMap: new Map(),
  statusIndex: new Map(),
};

class Enquiry {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.referenceNumber = data.referenceNumber || null; // Will be set in save()
    this.customerName = data.customerName;
    this.customerPhone = data.customerPhone;
    this.customerEmail = data.customerEmail || null;
    this.pickupLocation = data.pickupLocation;
    this.dropoffLocation = data.dropoffLocation;
    this.pickupDate = data.pickupDate;
    this.pickupTime = data.pickupTime;
    this.passengers = data.passengers || 1;
    this.vehicleType = data.vehicleType || 'Saloon';
    this.specialRequests = data.specialRequests || '';
    this.status = data.status || 'pending_quote'; // pending_quote, quoted, confirmed, cancelled
    this.quotedPrice = data.quotedPrice || null;
    this.quotedBy = data.quotedBy || null;
    this.quotedAt = data.quotedAt || null;
    this.quoteBreakdown = data.quoteBreakdown || null;
    this.quoteValidUntil = data.quoteValidUntil || null;
    this.source = data.source || 'whatsapp'; // whatsapp, web, phone
    // Partner forwarding fields
    this.forwardedToPartner = data.forwardedToPartner || false;
    this.partnerName = data.partnerName || null;
    this.partnerCommissionRate = data.partnerCommissionRate || null; // Percentage (e.g., 15 for 15%)
    this.partnerCommissionAmount = data.partnerCommissionAmount || null; // Calculated amount
    this.forwardedAt = data.forwardedAt || null;
    this.forwardedBy = data.forwardedBy || null;
    this.partnerBookingReference = data.partnerBookingReference || null;
    this.partnerNotes = data.partnerNotes || null;
    this.conversationHistory = data.conversationHistory || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Save enquiry to Redis
  async save() {
    // Generate reference number if not set
    if (!this.referenceNumber) {
      const { generateReferenceNumber } = await import('../utils/helpers.js');
      this.referenceNumber = await generateReferenceNumber();
    }

    this.updatedAt = new Date().toISOString();
    const key = `enquiry:${this.id}`;

    logger.info(`Saving enquiry ${this.id} with reference ${this.referenceNumber}`);

    // Convert to JSON object
    const jsonData = this.toJSON();

    try {
      // Try to save to Redis (primary storage)
      await redisClient.set(key, jsonData);

      // Add to index for listing
      const zaddResult1 = await redisClient.zadd('enquiries:all', {
        score: Date.now(),
        member: this.id,
      });
      logger.info(`Added to enquiries:all sorted set, result: ${zaddResult1}`);

      // Add to status index
      const zaddResult2 = await redisClient.zadd(`enquiries:status:${this.status}`, {
        score: Date.now(),
        member: this.id,
      });
      logger.info(`Added to enquiries:status:${this.status} sorted set, result: ${zaddResult2}`);

      // Add reference number mapping
      await redisClient.set(`enquiry:ref:${this.referenceNumber}`, this.id);
    } catch (error) {
      // Fallback to in-memory storage if Redis is unavailable
      logger.warn(`Redis unavailable, using in-memory storage for enquiry ${this.id}`);
      inMemoryStorage.enquiries.set(this.id, jsonData);
      inMemoryStorage.refMap.set(this.referenceNumber, this.id);

      if (!inMemoryStorage.statusIndex.has(this.status)) {
        inMemoryStorage.statusIndex.set(this.status, []);
      }
      inMemoryStorage.statusIndex.get(this.status).push(this.id);
    }

    // Try to index in Upstash Search (optional, don't fail if it doesn't work)
    try {
      await indexEnquiry({
        id: this.id,
        referenceNumber: this.referenceNumber,
        customerName: this.customerName,
        email: this.customerEmail,
        phone: this.customerPhone,
        pickupLocation: this.pickupLocation,
        dropoffLocation: this.dropoffLocation,
        tripType: `${this.pickupLocation} to ${this.dropoffLocation}`,
        vehicleType: this.vehicleType,
        status: this.status,
        source: this.source,
        notes: this.specialRequests,
        createdAt: this.createdAt,
      });
    } catch (error) {
      logger.warn(`Failed to index enquiry in search: ${error.message}`);
    }

    logger.info(`Enquiry ${this.id} saved successfully`);
    return this;
  }

  // Find enquiry by ID
  static async findById(id) {
    try {
      const key = `enquiry:${id}`;
      const data = await redisClient.get(key);

      if (!data) return null;

      // Upstash Redis automatically deserializes JSON, so data is already an object
      return new Enquiry(data);
    } catch (error) {
      logger.error(`Error loading enquiry ${id}:`, error);
      return null;
    }
  }

  // Find enquiry by reference number
  static async findByReference(referenceNumber) {
    const id = await redisClient.get(`enquiry:ref:${referenceNumber}`);
    if (!id) return null;
    return this.findById(id);
  }

  // Find enquiries by status
  static async findByStatus(status, limit = 20, offset = 0) {
    try {
      const ids = await redisClient.zrange(
        `enquiries:status:${status}`,
        offset,
        offset + limit - 1,
        {
          REV: true,
        }
      );

      logger.info(`Found ${ids.length} enquiry IDs for status ${status}`);

      if (!ids || ids.length === 0) {
        return [];
      }

      const enquiries = await Promise.all(ids.map((id) => this.findById(id)));

      return enquiries.filter((e) => e !== null);
    } catch (error) {
      logger.error(`Error in findByStatus(${status}):`, error);
      return [];
    }
  }

  // Get all enquiries
  static async findAll(limit = 20, offset = 0) {
    try {
      // Try Redis first
      const ids = await redisClient.zrange('enquiries:all', offset, offset + limit - 1, {
        REV: true,
      });

      logger.info(`Found ${ids.length} enquiry IDs in sorted set`);

      if (!ids || ids.length === 0) {
        return [];
      }

      const enquiries = await Promise.all(ids.map((id) => this.findById(id)));

      return enquiries.filter((e) => e !== null);
    } catch (error) {
      logger.warn('Redis unavailable in findAll, using in-memory storage');

      // Fallback to in-memory storage
      const allEnquiries = Array.from(inMemoryStorage.enquiries.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(offset, offset + limit)
        .map((data) => new Enquiry(data));

      return allEnquiries;
    }
  }

  // Update enquiry
  async update(data) {
    Object.assign(this, data);
    return this.save();
  }

  // Delete enquiry
  async delete() {
    const key = `enquiry:${this.id}`;
    await redisClient.del(key);
    await redisClient.zrem('enquiries:all', this.id);
    await redisClient.zrem(`enquiries:status:${this.status}`, this.id);
    await redisClient.del(`enquiry:ref:${this.referenceNumber}`);

    // Remove from search index
    await removeEnquiryFromIndex(this.id);
  }

  // Search enquiries with AI-powered search
  static async search(query, options = {}) {
    const { searchEnquiries, isSearchAvailable } = await import('../services/searchService.js');

    if (!isSearchAvailable()) {
      logger.warn('Search not available, falling back to basic listing');
      return this.findAll();
    }

    try {
      const results = await searchEnquiries(query, options);

      // Convert search results to Enquiry instances
      const enquiries = await Promise.all(
        results.map(async (result) => {
          const enquiry = await this.findById(result.metadata.id);
          return enquiry;
        })
      );

      return enquiries.filter(Boolean);
    } catch (error) {
      logger.error('Search failed:', error);
      return this.findAll();
    }
  }

  // Delete all enquiries (for debugging)
  static async deleteAll() {
    try {
      // Get all enquiry keys
      const enquiryKeys = await redisClient.keys('enquiry:*');
      const refKeys = await redisClient.keys('enquiry:ref:*');

      let deleted = 0;

      // Delete all enquiry-related keys
      if (enquiryKeys.length > 0) {
        await redisClient.del(...enquiryKeys);
        deleted += enquiryKeys.length;
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

      // Clear counter
      const year = new Date().getFullYear();
      await redisClient.del(`counter:ref:${year}`);

      logger.info(`Deleted ${deleted} enquiries from Redis`);
      return deleted;
    } catch (error) {
      logger.error('Error deleting all enquiries:', error);
      throw error;
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      referenceNumber: this.referenceNumber,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerEmail: this.customerEmail,
      pickupLocation: this.pickupLocation,
      dropoffLocation: this.dropoffLocation,
      pickupDate: this.pickupDate,
      pickupTime: this.pickupTime,
      passengers: this.passengers,
      vehicleType: this.vehicleType,
      specialRequests: this.specialRequests,
      status: this.status,
      quotedPrice: this.quotedPrice,
      quotedBy: this.quotedBy,
      quotedAt: this.quotedAt,
      quoteBreakdown: this.quoteBreakdown,
      quoteValidUntil: this.quoteValidUntil,
      source: this.source,
      conversationHistory: this.conversationHistory || [],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default Enquiry;
