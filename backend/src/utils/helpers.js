import redisClient from '../config/redis.js';

// In-memory counter fallback when Redis is unavailable
let inMemoryCounter = 0;

/**
 * Generate unique reference number for bookings
 * Format: JT-YYYY-XXXXXX (e.g., JT-2025-001234)
 */
export const generateReferenceNumber = async () => {
  const prefix = process.env.REF_PREFIX || 'JT';
  const year = new Date().getFullYear();

  let counter;

  try {
    // Try to use Redis for counter
    const counterKey = `counter:ref:${year}`;
    counter = await redisClient.incr(counterKey);

    // Set expiry for counter at end of year
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    const ttl = Math.floor((endOfYear - new Date()) / 1000);
    await redisClient.expire(counterKey, ttl);
  } catch (error) {
    // Fallback to in-memory counter + timestamp for uniqueness
    inMemoryCounter++;
    const timestamp = Date.now().toString().slice(-6);
    counter = parseInt(timestamp) + inMemoryCounter;
    console.warn('Redis unavailable, using fallback counter:', counter);
  }

  // Format: JT-2026-001234
  const paddedCounter = String(counter).padStart(6, '0');
  return `${prefix}-${year}-${paddedCounter}`;
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone) => {
  // Basic validation for international format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format time to HH:MM
 */
export const formatTime = (time) => {
  if (time.includes(':')) return time;
  // Handle various time formats
  return time;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Sanitize string for safe storage
 */
export const sanitizeString = (str) => {
  if (!str) return '';
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Generate random string
 */
export const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Parse natural language date
 */
export const parseNaturalDate = (dateStr) => {
  const today = new Date();
  const lower = dateStr.toLowerCase();

  if (lower.includes('today')) {
    return formatDate(today);
  }

  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }

  // Try to parse as regular date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return formatDate(parsed);
  }

  return null;
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'GBP') => {
  const symbols = {
    GBP: '£',
    USD: '$',
    EUR: '€',
  };

  return `${symbols[currency] || currency}${amount.toFixed(2)}`;
};

/**
 * Create success response
 */
export const successResponse = (data, message = null) => {
  const response = { success: true, data };
  if (message) response.message = message;
  return response;
};

/**
 * Create error response
 */
export const errorResponse = (code, message, details = null) => {
  const response = {
    success: false,
    error: { code, message },
  };
  if (details) response.error.details = details;
  return response;
};
