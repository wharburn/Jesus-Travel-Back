import 'dotenv/config';
import { query } from '../config/postgres.js';

class Quote {
  /**
   * Generate a unique quote number
   * @returns {Promise<string>}
   */
  static async generateQuoteNumber() {
    const prefix = process.env.QUOTE_NUMBER_PREFIX || 'JT';
    const year = new Date().getFullYear();

    // Get the count of quotes created this year
    const result = await query(
      `SELECT COUNT(*) as count FROM quotes
       WHERE quote_number LIKE $1`,
      [`${prefix}-${year}-%`]
    );

    const count = parseInt(result.rows[0].count) + 1;
    const paddedCount = count.toString().padStart(6, '0');

    return `${prefix}-${year}-${paddedCount}`;
  }

  /**
   * Create a new quote
   * @param {Object} quoteData - The quote data
   * @returns {Promise<Object>}
   */
  static async create(quoteData) {
    try {
      const quoteNumber = await this.generateQuoteNumber();
      const validityHours = parseInt(process.env.QUOTE_VALIDITY_HOURS || 48);
      const validUntil = new Date(Date.now() + validityHours * 60 * 60 * 1000);

      const result = await query(
        `INSERT INTO quotes (
          quote_number, enquiry_id,
          customer_name, customer_phone, customer_email,
          pickup_location, pickup_lat, pickup_lng,
          dropoff_location, dropoff_lat, dropoff_lng,
          pickup_datetime,
          vehicle_type, passengers, luggage,
          distance_km, duration_minutes,
          base_fare, distance_charge, zone_charges,
          time_multiplier, time_multiplier_name,
          subtotal, total_amount,
          status, pricing_mode,
          suggested_amount,
          valid_until,
          calculation_time_ms
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
        ) RETURNING *`,
        [
          quoteNumber,
          quoteData.enquiry_id || null,
          quoteData.customer_name || null,
          quoteData.customer_phone || null,
          quoteData.customer_email || null,
          quoteData.pickup.formatted_address,
          quoteData.pickup.lat,
          quoteData.pickup.lng,
          quoteData.dropoff.formatted_address,
          quoteData.dropoff.lat,
          quoteData.dropoff.lng,
          quoteData.pickup_datetime,
          quoteData.vehicle_type,
          quoteData.passengers || 1,
          quoteData.luggage || 0,
          quoteData.distance.km,
          quoteData.duration.minutes,
          quoteData.pricing.base_fare,
          quoteData.pricing.distance_charge,
          JSON.stringify(quoteData.pricing.zone_breakdown),
          quoteData.pricing.time_multiplier,
          quoteData.pricing.time_multiplier_name,
          quoteData.pricing.subtotal,
          quoteData.pricing.total_amount,
          'pending',
          process.env.PRICING_MODE || 'supervised',
          quoteData.pricing.total_amount, // suggested_amount
          validUntil,
          quoteData.calculation_time_ms || 0,
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  /**
   * Get quote by ID
   * @param {string} id - Quote ID
   * @returns {Promise<Object>}
   */
  static async findById(id) {
    const result = await query(`SELECT * FROM quotes WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get quote by quote number
   * @param {string} quoteNumber - Quote number
   * @returns {Promise<Object>}
   */
  static async findByQuoteNumber(quoteNumber) {
    const result = await query(`SELECT * FROM quotes WHERE quote_number = $1`, [quoteNumber]);
    return result.rows[0] || null;
  }

  /**
   * Update quote status
   * @param {string} id - Quote ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional fields to update
   * @returns {Promise<Object>}
   */
  static async updateStatus(id, status, additionalData = {}) {
    const fields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
    const values = [id, status];
    let paramCount = 3;

    Object.keys(additionalData).forEach((key) => {
      fields.push(`${key} = $${paramCount}`);
      values.push(additionalData[key]);
      paramCount++;
    });

    const result = await query(
      `UPDATE quotes SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Approve quote (supervised mode)
   * @param {string} id - Quote ID
   * @param {number} approvedAmount - Approved amount (may differ from suggested)
   * @param {string} approvedBy - Who approved it
   * @param {string} reason - Modification reason (if amount changed)
   * @returns {Promise<Object>}
   */
  static async approve(id, approvedAmount, approvedBy, reason = null) {
    const result = await query(
      `UPDATE quotes SET
        status = 'approved',
        approved_amount = $2,
        approved_by = $3,
        approved_at = CURRENT_TIMESTAMP,
        modification_reason = $4,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, approvedAmount, approvedBy, reason]
    );

    return result.rows[0];
  }

  /**
   * Reject quote
   * @param {string} id - Quote ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>}
   */
  static async reject(id, reason) {
    return await this.updateStatus(id, 'rejected', { modification_reason: reason });
  }

  /**
   * Mark quote as sent to customer
   * @param {string} id - Quote ID
   * @returns {Promise<Object>}
   */
  static async markAsSent(id) {
    return await this.updateStatus(id, 'sent', { sent_at: new Date() });
  }

  /**
   * Mark quote as accepted by customer
   * @param {string} id - Quote ID
   * @returns {Promise<Object>}
   */
  static async markAsAccepted(id) {
    return await this.updateStatus(id, 'accepted', { accepted_at: new Date() });
  }

  /**
   * Get recent quotes
   * @param {number} limit - Number of quotes to return
   * @returns {Promise<Array>}
   */
  static async getRecent(limit = 50) {
    const result = await query(`SELECT * FROM quotes ORDER BY created_at DESC LIMIT $1`, [limit]);
    return result.rows;
  }

  /**
   * Get quotes by status
   * @param {string} status - Quote status
   * @param {number} limit - Number of quotes to return
   * @returns {Promise<Array>}
   */
  static async getByStatus(status, limit = 50) {
    const result = await query(
      `SELECT * FROM quotes WHERE status = $1 ORDER BY created_at DESC LIMIT $2`,
      [status, limit]
    );
    return result.rows;
  }
}

export default Quote;
