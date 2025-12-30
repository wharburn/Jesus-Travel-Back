import { v4 as uuidv4 } from 'uuid';
import redisClient from '../config/redis.js';
import { indexEnquiry } from '../services/searchService.js';
import logger from '../utils/logger.js';

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

    // Convert to JSON and log for debugging
    const jsonData = this.toJSON();
    const jsonString = JSON.stringify(jsonData);
    logger.info(
      `JSON string length: ${jsonString.length}, first 200 chars: ${jsonString.substring(0, 200)}`
    );

    // Save to Redis (primary storage)
    await redisClient.set(key, jsonString);

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

    // Index in Upstash Search for AI-powered search
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

    logger.info(`Enquiry ${this.id} saved successfully`);
    return this;
  }

  // Find enquiry by ID
  static async findById(id) {
    try {
      const key = `enquiry:${id}`;
      const data = await redisClient.get(key);
      if (!data) return null;

      const parsed = JSON.parse(data);
      return new Enquiry(parsed);
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
      // Get IDs from sorted set (newest first)
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
      logger.error('Error in findAll:', error);
      return [];
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
