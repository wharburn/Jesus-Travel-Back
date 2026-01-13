import { query } from '../../config/postgres.js';

/**
 * Get the appropriate time multiplier for a given datetime
 * @param {Date} datetime - The pickup datetime
 * @returns {Promise<{multiplier: number, name: string}>}
 */
const getTimeMultiplier = async (datetime) => {
  try {
    const dayOfWeek = datetime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const time = datetime.toTimeString().slice(0, 8); // HH:MM:SS format

    // Query database for matching time multipliers
    const result = await query(
      `SELECT name, multiplier, priority
       FROM time_multipliers
       WHERE active = true
       AND $1 = ANY(day_of_week)
       AND $2 >= start_time
       AND $2 <= end_time
       ORDER BY priority DESC
       LIMIT 1`,
      [dayOfWeek, time]
    );

    if (result.rows.length > 0) {
      return {
        multiplier: parseFloat(result.rows[0].multiplier),
        name: result.rows[0].name,
      };
    }

    // Default to 1.0 if no multiplier found
    return {
      multiplier: 1.0,
      name: 'Standard',
    };
  } catch (error) {
    console.error('Time multiplier error:', error);
    // Return default on error
    return {
      multiplier: 1.0,
      name: 'Standard',
    };
  }
};

/**
 * Check if a datetime is during peak hours
 * @param {Date} datetime - The datetime to check
 * @returns {Promise<boolean>}
 */
const isPeakTime = async (datetime) => {
  const { name } = await getTimeMultiplier(datetime);
  return name.toLowerCase().includes('peak') && !name.toLowerCase().includes('off');
};

/**
 * Check if a datetime is during off-peak hours
 * @param {Date} datetime - The datetime to check
 * @returns {Promise<boolean>}
 */
const isOffPeakTime = async (datetime) => {
  const { name } = await getTimeMultiplier(datetime);
  return name.toLowerCase().includes('off-peak');
};

/**
 * Get all time multipliers (for admin dashboard)
 * @returns {Promise<Array>}
 */
const getAllTimeMultipliers = async () => {
  try {
    const result = await query(
      `SELECT * FROM time_multipliers ORDER BY priority DESC, start_time ASC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching time multipliers:', error);
    throw error;
  }
};

/**
 * Create a new time multiplier
 * @param {Object} multiplierData - The multiplier data
 * @returns {Promise<Object>}
 */
const createTimeMultiplier = async (multiplierData) => {
  try {
    const { name, multiplier, day_of_week, start_time, end_time, priority } = multiplierData;

    const result = await query(
      `INSERT INTO time_multipliers (name, multiplier, day_of_week, start_time, end_time, priority)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, multiplier, day_of_week, start_time, end_time, priority || 0]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating time multiplier:', error);
    throw error;
  }
};

/**
 * Update a time multiplier
 * @param {string} id - The multiplier ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>}
 */
const updateTimeMultiplier = async (id, updates) => {
  try {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE time_multipliers
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error updating time multiplier:', error);
    throw error;
  }
};

/**
 * Delete a time multiplier
 * @param {string} id - The multiplier ID
 * @returns {Promise<boolean>}
 */
const deleteTimeMultiplier = async (id) => {
  try {
    await query(`DELETE FROM time_multipliers WHERE id = $1`, [id]);
    return true;
  } catch (error) {
    console.error('Error deleting time multiplier:', error);
    throw error;
  }
};

/**
 * Get human-readable description of time period
 * @param {Date} datetime - The datetime
 * @returns {Promise<string>}
 */
const getTimePeriodDescription = async (datetime) => {
  const { name, multiplier } = await getTimeMultiplier(datetime);

  if (multiplier > 1.0) {
    return `${name} (+${((multiplier - 1) * 100).toFixed(0)}%)`;
  } else if (multiplier < 1.0) {
    return `${name} (-${((1 - multiplier) * 100).toFixed(0)}%)`;
  } else {
    return name;
  }
};

export {
  createTimeMultiplier,
  deleteTimeMultiplier,
  getAllTimeMultipliers,
  getTimeMultiplier,
  getTimePeriodDescription,
  isOffPeakTime,
  isPeakTime,
  updateTimeMultiplier,
};
