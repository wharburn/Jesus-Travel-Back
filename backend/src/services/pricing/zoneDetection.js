import { query } from '../../config/postgres.js';

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Array} polygon - Array of [lng, lat] coordinates
 * @returns {boolean}
 */
const pointInPolygon = (lat, lng, polygon) => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Detect zones for a given location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} locationType - 'pickup' or 'dropoff'
 * @returns {Promise<Array>} Array of detected zones with charges
 */
const detectZones = async (lat, lng, locationType) => {
  try {
    // Get all active zones from database
    const result = await query(
      `SELECT * FROM zone_charges
       WHERE active = true
       AND (applies_to = $1 OR applies_to = 'both')`,
      [locationType]
    );

    const detectedZones = [];

    for (const zone of result.rows) {
      const coords = zone.coordinates;

      if (!coords) continue;

      // Handle different geometry types
      if (coords.type === 'Polygon') {
        // Check if point is inside polygon
        const polygon = coords.coordinates[0];
        if (pointInPolygon(lat, lng, polygon)) {
          detectedZones.push({
            zone_id: zone.id,
            zone_name: zone.zone_name,
            zone_type: zone.zone_type,
            charge: parseFloat(zone.charge_amount),
            applies_to: zone.applies_to,
          });
        }
      } else if (coords.type === 'Point') {
        // Check if point is within radius of airport (5km default)
        const [zoneLng, zoneLat] = coords.coordinates;
        const distance = haversineDistance(lat, lng, zoneLat, zoneLng);

        if (distance <= 5) {
          // Within 5km of airport
          detectedZones.push({
            zone_id: zone.id,
            zone_name: zone.zone_name,
            zone_type: zone.zone_type,
            charge: parseFloat(zone.charge_amount),
            applies_to: zone.applies_to,
            distance_km: distance.toFixed(2),
          });
        }
      }
    }

    return detectedZones;
  } catch (error) {
    console.error('Zone detection error:', error);
    // Return empty array on database error (fallback mode)
    console.log('⚠️  Using fallback mode - no zone charges will be applied');
    return [];
  }
};

/**
 * Detect all zones for a journey (pickup and dropoff)
 * @param {Object} pickup - {lat, lng}
 * @param {Object} dropoff - {lat, lng}
 * @returns {Promise<Object>} Object with pickup and dropoff zones
 */
const detectJourneyZones = async (pickup, dropoff) => {
  try {
    const [pickupZones, dropoffZones] = await Promise.all([
      detectZones(pickup.lat, pickup.lng, 'pickup'),
      detectZones(dropoff.lat, dropoff.lng, 'dropoff'),
    ]);

    // Combine and deduplicate zones
    const allZones = [...pickupZones, ...dropoffZones];

    // Remove duplicate zone types (keep the first occurrence)
    const uniqueZones = [];
    const seenTypes = new Set();

    for (const zone of allZones) {
      if (!seenTypes.has(zone.zone_type)) {
        uniqueZones.push(zone);
        seenTypes.add(zone.zone_type);
      }
    }

    // Calculate total zone charges
    const totalZoneCharges = uniqueZones.reduce((sum, zone) => sum + zone.charge, 0);

    return {
      pickup_zones: pickupZones,
      dropoff_zones: dropoffZones,
      all_zones: uniqueZones,
      total_charges: totalZoneCharges,
      breakdown: uniqueZones.map((z) => ({
        name: z.zone_name,
        type: z.zone_type,
        charge: z.charge,
      })),
    };
  } catch (error) {
    console.error('Journey zone detection error:', error);
    throw error;
  }
};

/**
 * Check if location is in London Congestion Zone
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<boolean>}
 */
const isInCongestionZone = async (lat, lng) => {
  const zones = await detectZones(lat, lng, 'both');
  return zones.some((z) => z.zone_type === 'congestion');
};

/**
 * Check if location is in ULEZ
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<boolean>}
 */
const isInULEZ = async (lat, lng) => {
  const zones = await detectZones(lat, lng, 'both');
  return zones.some((z) => z.zone_type === 'ulez');
};

/**
 * Check if location is an airport
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object|null>}
 */
const isAirport = async (lat, lng) => {
  const zones = await detectZones(lat, lng, 'pickup');
  const airport = zones.find((z) => z.zone_type === 'airport');
  return airport || null;
};

export {
  detectJourneyZones,
  detectZones,
  haversineDistance,
  isAirport,
  isInCongestionZone,
  isInULEZ,
  pointInPolygon,
};
