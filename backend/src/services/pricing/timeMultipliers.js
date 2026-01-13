// import { query } from '../../config/postgres.js'; // Disabled - using in-memory rules

// In-memory time multipliers (no database required)
const TIME_MULTIPLIERS = [
  {
    name: 'Peak Morning',
    multiplier: 1.3,
    day_of_week: [1, 2, 3, 4, 5], // Monday-Friday
    start_time: '07:00:00',
    end_time: '09:30:00',
    priority: 10,
  },
  {
    name: 'Peak Evening',
    multiplier: 1.2,
    day_of_week: [1, 2, 3, 4, 5], // Monday-Friday
    start_time: '17:00:00',
    end_time: '19:30:00',
    priority: 9,
  },
  {
    name: 'Off-Peak Night',
    multiplier: 0.9,
    day_of_week: [0, 1, 2, 3, 4, 5, 6], // All days
    start_time: '22:00:00',
    end_time: '06:00:00',
    priority: 5,
  },
  {
    name: 'Weekend Premium',
    multiplier: 1.15,
    day_of_week: [0, 6], // Saturday, Sunday
    start_time: '00:00:00',
    end_time: '23:59:59',
    priority: 3,
  },
];

/**
 * Get the appropriate time multiplier for a given datetime
 * @param {Date} datetime - The pickup datetime
 * @returns {Promise<{multiplier: number, name: string}>}
 */
const getTimeMultiplier = async (datetime) => {
  try {
    const dayOfWeek = datetime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const time = datetime.toTimeString().slice(0, 8); // HH:MM:SS format

    // Find matching time multipliers from in-memory rules
    const matches = TIME_MULTIPLIERS.filter((rule) => {
      // Check if day matches
      if (!rule.day_of_week.includes(dayOfWeek)) return false;

      // Check if time is within range
      // Handle overnight periods (e.g., 22:00:00 to 06:00:00)
      if (rule.start_time > rule.end_time) {
        return time >= rule.start_time || time <= rule.end_time;
      } else {
        return time >= rule.start_time && time <= rule.end_time;
      }
    });

    // Sort by priority and return highest
    if (matches.length > 0) {
      matches.sort((a, b) => b.priority - a.priority);
      return {
        multiplier: parseFloat(matches[0].multiplier),
        name: matches[0].name,
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
  // Return in-memory time multipliers
  return TIME_MULTIPLIERS.sort((a, b) => b.priority - a.priority);
};

/**
 * Create a new time multiplier (not supported with in-memory storage)
 * @param {Object} multiplierData - The multiplier data
 * @returns {Promise<Object>}
 */
const createTimeMultiplier = async (multiplierData) => {
  throw new Error('Creating time multipliers requires database configuration');
};

/**
 * Update a time multiplier (not supported with in-memory storage)
 * @param {string} id - The multiplier ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>}
 */
const updateTimeMultiplier = async (id, updates) => {
  throw new Error('Updating time multipliers requires database configuration');
};

/**
 * Delete a time multiplier (not supported with in-memory storage)
 * @param {string} id - The multiplier ID
 * @returns {Promise<boolean>}
 */
const deleteTimeMultiplier = async (id) => {
  throw new Error('Deleting time multipliers requires database configuration');
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
