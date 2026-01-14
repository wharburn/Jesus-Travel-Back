import 'dotenv/config';
// import { query } from '../../config/postgres.js'; // Disabled - using in-memory pricing rules
import { getSetting } from '../../utils/settings.js';
import { getJourneyDetails } from './googleMaps.js';
import { getTimeMultiplier } from './timeMultipliers.js';
import { detectJourneyZones } from './zoneDetection.js';

// Conversion constants
const KM_TO_MILES = 0.621371;
const MILES_TO_KM = 1.60934;

/**
 * Convert distance based on format setting
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} format - 'km' or 'miles'
 * @returns {Object} - { value: number, unit: string }
 */
const convertDistance = (distanceKm, format = 'km') => {
  if (format === 'miles') {
    return {
      value: parseFloat((distanceKm * KM_TO_MILES).toFixed(2)),
      unit: 'mi',
    };
  }
  return {
    value: parseFloat(distanceKm.toFixed(2)),
    unit: 'km',
  };
};

// Default pricing rules (used when settings are missing or invalid)
const DEFAULT_PRICING_RULES = {
  'Executive Sedan': { base_fare: 60.0, per_km_rate: 2.5, hourly_rate: 50.0, max_passengers: 3 },
  'Luxury Sedan': { base_fare: 80.0, per_km_rate: 3.0, hourly_rate: 60.0, max_passengers: 2 },
  'MPV Executive': { base_fare: 100.0, per_km_rate: 3.5, hourly_rate: 60.0, max_passengers: 6 },
  'Luxury SUV': { base_fare: 90.0, per_km_rate: 3.2, hourly_rate: 70.0, max_passengers: 3 },
  Minibus: { base_fare: 120.0, per_km_rate: 4.0, hourly_rate: 60.0, max_passengers: 8 },
};

let cachedPricingRules = null;

const mapSettingToRule = (settingsRules, key, vehicleName) => {
  const fallback = DEFAULT_PRICING_RULES[vehicleName];
  const rule = (settingsRules && settingsRules[key]) || {};

  const baseFare = parseFloat(
    rule.baseFare !== undefined && rule.baseFare !== null ? rule.baseFare : fallback.base_fare
  );
  const perKmRate = parseFloat(
    rule.perKmRate !== undefined && rule.perKmRate !== null ? rule.perKmRate : fallback.per_km_rate
  );
  const hourlyRate = parseFloat(
    rule.hourlyRate !== undefined && rule.hourlyRate !== null
      ? rule.hourlyRate
      : fallback.hourly_rate
  );

  return {
    base_fare: Number.isFinite(baseFare) ? baseFare : fallback.base_fare,
    per_km_rate: Number.isFinite(perKmRate) ? perKmRate : fallback.per_km_rate,
    hourly_rate: Number.isFinite(hourlyRate) ? hourlyRate : fallback.hourly_rate,
    max_passengers: fallback.max_passengers,
  };
};

const loadPricingRulesFromSettings = async () => {
  try {
    const settingsRules = await getSetting('pricingRules');

    if (!settingsRules || typeof settingsRules !== 'object') {
      cachedPricingRules = { ...DEFAULT_PRICING_RULES };
      return cachedPricingRules;
    }

    const rules = {
      'Executive Sedan': mapSettingToRule(settingsRules, 'executiveSedan', 'Executive Sedan'),
      'Luxury Sedan': mapSettingToRule(settingsRules, 'luxurySedan', 'Luxury Sedan'),
      'MPV Executive': mapSettingToRule(settingsRules, 'mpvExecutive', 'MPV Executive'),
      'Luxury SUV': mapSettingToRule(settingsRules, 'luxurySUV', 'Luxury SUV'),
      Minibus: mapSettingToRule(settingsRules, 'minibus', 'Minibus'),
    };

    cachedPricingRules = rules;
    return rules;
  } catch (error) {
    console.error('Error loading pricing rules from settings:', error);
    cachedPricingRules = { ...DEFAULT_PRICING_RULES };
    return cachedPricingRules;
  }
};

const getActivePricingRules = async () => {
  if (cachedPricingRules) {
    return cachedPricingRules;
  }
  return loadPricingRulesFromSettings();
};

/**
 * Clear the cached pricing rules (call this when settings are updated)
 */
const clearPricingCache = () => {
  console.log('🔄 Clearing pricing rules cache');
  cachedPricingRules = null;
};

/**
 * Map frontend vehicle types to backend pricing rule names
 * @param {string} vehicleType - The vehicle type from frontend
 * @returns {string} - The mapped vehicle type for pricing rules
 */
const mapVehicleType = (vehicleType) => {
  const mapping = {
    // New vehicle types (from booking form)
    'executive-sedan': 'Executive Sedan',
    'luxury-sedan': 'Luxury Sedan',
    'mpv-executive': 'MPV Executive',
    'luxury-suv': 'Luxury SUV',
    minibus: 'Minibus',
    // Legacy variants (for backward compatibility)
    saloon: 'Executive Sedan',
    mpv: 'MPV Executive',
    suv: 'Luxury SUV',
    Saloon: 'Executive Sedan',
    MPV: 'MPV Executive',
    SUV: 'Luxury SUV',
    Minibus: 'Minibus',
    'Standard Sedan': 'Executive Sedan',
    'Executive MPV': 'MPV Executive',
    'Luxury MPV': 'MPV Executive',
    'executive-eclass': 'Executive Sedan',
    'luxury-sclass': 'Luxury Sedan',
    'mpv-vclass': 'MPV Executive',
    'Executive E-Class': 'Executive Sedan',
    'Luxury S-Class': 'Luxury Sedan',
    'MPV V-Class': 'MPV Executive',
    // Already correct names (pass through)
    'Executive Sedan': 'Executive Sedan',
    'Luxury Sedan': 'Luxury Sedan',
    'MPV Executive': 'MPV Executive',
    'Luxury SUV': 'Luxury SUV',
  };

  return mapping[vehicleType] || vehicleType;
};

/**
 * Get pricing rule for a vehicle type
 * @param {string} vehicleType - The vehicle type
 * @returns {Promise<Object>}
 */
const getPricingRule = async (vehicleType) => {
  const rules = await getActivePricingRules();

  // Map the vehicle type to the correct pricing rule name
  const mappedType = mapVehicleType(vehicleType);

  if (rules[mappedType]) {
    return {
      vehicle_type: mappedType,
      ...rules[mappedType],
      active: true,
    };
  }

  throw new Error(
    `No pricing rule found for vehicle type: ${vehicleType} (mapped to: ${mappedType})`
  );
};

/**
 * Round price to nearest increment
 * @param {number} amount - The amount to round
 * @param {number} increment - The rounding increment (default 0.50)
 * @returns {number}
 */
const roundPrice = (amount, increment = 0.5) => {
  return Math.round(amount / increment) * increment;
};

/**
 * Calculate quote for "At Disposal" (hourly) booking
 * @param {Object} params - Disposal quote parameters
 * @returns {Promise<Object>}
 */
const calculateDisposalQuote = async (params) => {
  const startTime = Date.now();

  try {
    const {
      pickupAddress,
      pickupDatetime,
      vehicleType,
      hours,
      passengers = 1,
      luggage = 0,
      includeCongestion = false,
    } = params;

    console.log(`⏰ Calculating disposal quote: ${hours} hours with ${vehicleType}`);

    // Minimum 8 hours for disposal bookings
    const MIN_HOURS = 8;
    const actualHours = Math.max(hours || MIN_HOURS, MIN_HOURS);

    // Get pricing rule for vehicle type
    const pricingRule = await getPricingRule(vehicleType);
    const hourlyRate = parseFloat(pricingRule.hourly_rate || 0);

    if (hourlyRate === 0) {
      throw new Error(`No hourly rate configured for vehicle type: ${vehicleType}`);
    }

    // Calculate hourly charge
    const hourlyCharge = actualHours * hourlyRate;

    // Get congestion charge if applicable
    let congestionCharge = 0;
    if (includeCongestion) {
      // Standard London congestion charge
      congestionCharge = 15.0;
    }

    // Get time multiplier (for peak times, weekends, etc.)
    const timeInfo = await getTimeMultiplier(new Date(pickupDatetime));

    // Calculate subtotal (before time multiplier)
    const subtotal = hourlyCharge + congestionCharge;

    // Apply time multiplier
    const totalBeforeRounding = subtotal * timeInfo.multiplier;

    // Round to nearest increment
    const roundingIncrement = parseFloat(process.env.QUOTE_ROUNDING || 0.5);
    const totalAmount = roundPrice(totalBeforeRounding, roundingIncrement);

    // Validate quote amount
    const minAmount = parseFloat(process.env.MIN_QUOTE_AMOUNT || 30);
    const maxAmount = parseFloat(process.env.MAX_QUOTE_AMOUNT || 5000);

    if (totalAmount < minAmount) {
      throw new Error(`Quote amount £${totalAmount} is below minimum £${minAmount}`);
    }

    if (totalAmount > maxAmount) {
      console.warn(`⚠️  Quote amount £${totalAmount} exceeds maximum £${maxAmount}`);
    }

    const calculationTime = Date.now() - startTime;

    // Return detailed quote breakdown
    return {
      // Booking type
      booking_type: 'disposal',

      // Journey details
      pickup: {
        address: pickupAddress,
        formatted_address: pickupAddress,
      },
      pickup_datetime: pickupDatetime,
      hours: actualHours,
      minimum_hours: MIN_HOURS,

      // Vehicle details
      vehicle_type: vehicleType,
      passengers,
      luggage,

      // Pricing breakdown
      pricing: {
        hourly_rate: hourlyRate,
        hourly_charge: hourlyCharge,
        congestion_charge: congestionCharge,
        subtotal: subtotal,
        time_multiplier: timeInfo.multiplier,
        time_multiplier_name: timeInfo.name,
        total_before_rounding: totalBeforeRounding,
        total_amount: totalAmount,
      },

      // Metadata
      calculation_time_ms: calculationTime,
      calculated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Disposal quote calculation error:', error);
    throw error;
  }
};

/**
 * Calculate quote for a journey
 * @param {Object} params - Quote parameters
 * @returns {Promise<Object>}
 */
const calculateQuote = async (params) => {
  const startTime = Date.now();

  try {
    const {
      pickupAddress,
      dropoffAddress,
      pickupDatetime,
      vehicleType,
      passengers = 1,
      luggage = 0,
    } = params;

    console.log(`💰 Calculating quote: ${pickupAddress} → ${dropoffAddress}`);

    // Step 1: Get journey details from Google Maps
    const journey = await getJourneyDetails(
      pickupAddress,
      dropoffAddress,
      new Date(pickupDatetime)
    );

    // Step 2: Get pricing rule for vehicle type
    const pricingRule = await getPricingRule(vehicleType);

    // Step 3: Calculate base fare and distance charge
    const baseFare = parseFloat(pricingRule.base_fare);
    const distanceCharge = journey.distance.km * parseFloat(pricingRule.per_km_rate);

    // Step 4: Detect zones and calculate zone charges
    const zones = await detectJourneyZones(journey.pickup, journey.dropoff);

    // Step 5: Get time multiplier
    const timeInfo = await getTimeMultiplier(new Date(pickupDatetime));

    // Step 6: Calculate subtotal (before time multiplier)
    const subtotal = baseFare + distanceCharge + zones.total_charges;

    // Step 7: Apply time multiplier
    const totalBeforeRounding = subtotal * timeInfo.multiplier;

    // Step 8: Round to nearest increment
    const roundingIncrement = parseFloat(process.env.QUOTE_ROUNDING || 0.5);
    const totalAmount = roundPrice(totalBeforeRounding, roundingIncrement);

    // Step 9: Validate quote amount
    const minAmount = parseFloat(process.env.MIN_QUOTE_AMOUNT || 30);
    const maxAmount = parseFloat(process.env.MAX_QUOTE_AMOUNT || 5000);

    if (totalAmount < minAmount) {
      throw new Error(`Quote amount £${totalAmount} is below minimum £${minAmount}`);
    }

    if (totalAmount > maxAmount) {
      console.warn(`⚠️  Quote amount £${totalAmount} exceeds maximum £${maxAmount}`);
    }

    const calculationTime = Date.now() - startTime;

    // Get distance format setting
    const distanceFormat = (await getSetting('quotes'))?.distanceFormat || 'km';
    const displayDistance = convertDistance(journey.distance.km, distanceFormat);

    // Return detailed quote breakdown
    return {
      // Journey details
      pickup: journey.pickup,
      dropoff: journey.dropoff,
      distance: {
        ...journey.distance,
        display: displayDistance.value,
        unit: displayDistance.unit,
        format: distanceFormat,
      },
      duration: journey.duration,
      pickup_datetime: pickupDatetime,

      // Vehicle details
      vehicle_type: vehicleType,
      passengers,
      luggage,

      // Pricing breakdown
      pricing: {
        base_fare: baseFare,
        distance_charge: distanceCharge,
        zone_charges: zones.total_charges,
        zone_breakdown: zones.breakdown,
        subtotal: subtotal,
        time_multiplier: timeInfo.multiplier,
        time_multiplier_name: timeInfo.name,
        total_before_rounding: totalBeforeRounding,
        total_amount: totalAmount,
      },

      // Zones detected
      zones: zones.all_zones,

      // Metadata
      calculation_time_ms: calculationTime,
      calculated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Quote calculation error:', error);
    throw error;
  }
};

/**
 * Format quote for customer display
 * @param {Object} quote - The quote object
 * @returns {string}
 */
const formatQuoteForCustomer = (quote) => {
  const { pickup, dropoff, distance, duration, pricing, vehicle_type } = quote;

  // Use display distance if available, otherwise fall back to km
  const displayDist = distance.display || distance.km;
  const distUnit = distance.unit || 'km';

  let message = `✅ Quote Ready\n\n`;
  message += `📍 From: ${pickup.formatted_address}\n`;
  message += `📍 To: ${dropoff.formatted_address}\n`;
  message += `📏 Distance: ${displayDist} ${distUnit} (~${duration.minutes} mins)\n`;
  message += `🚗 Vehicle: ${vehicle_type}\n\n`;
  message += `💰 Quote Breakdown:\n`;
  message += `   Base Fare:         £${pricing.base_fare.toFixed(2)}\n`;
  message += `   Distance (${displayDist}${distUnit}): £${pricing.distance_charge.toFixed(2)}\n`;

  if (pricing.zone_breakdown.length > 0) {
    pricing.zone_breakdown.forEach((zone) => {
      message += `   ${zone.name}: £${zone.charge.toFixed(2)}\n`;
    });
  }

  message += `   ─────────────────────────\n`;
  message += `   Subtotal:          £${pricing.subtotal.toFixed(2)}\n`;

  if (pricing.time_multiplier !== 1.0) {
    message += `   ${pricing.time_multiplier_name} (${pricing.time_multiplier}x): Applied\n`;
  }

  message += `   ─────────────────────────\n`;
  message += `   TOTAL:            £${pricing.total_amount.toFixed(2)}\n\n`;
  message += `Valid for 48 hours\n\n`;
  message += `Reply YES to confirm booking`;

  return message;
};

/**
 * Format disposal quote for customer display
 * @param {Object} quote - The disposal quote object
 * @returns {string}
 */
const formatDisposalQuoteForCustomer = (quote) => {
  const { pickup, hours, minimum_hours, pricing, vehicle_type } = quote;

  let message = `✅ At Disposal Quote Ready\n\n`;
  message += `📍 Pickup: ${pickup.formatted_address}\n`;
  message += `⏰ Duration: ${hours} hours (minimum ${minimum_hours} hours)\n`;
  message += `🚗 Vehicle: ${vehicle_type}\n\n`;
  message += `💰 Quote Breakdown:\n`;
  message += `   Hourly Rate (£${pricing.hourly_rate}/hr): £${pricing.hourly_charge.toFixed(2)}\n`;

  if (pricing.congestion_charge > 0) {
    message += `   Congestion Charge:  £${pricing.congestion_charge.toFixed(2)}\n`;
  }

  message += `   ─────────────────────────\n`;
  message += `   Subtotal:          £${pricing.subtotal.toFixed(2)}\n`;

  if (pricing.time_multiplier !== 1.0) {
    message += `   ${pricing.time_multiplier_name} (${pricing.time_multiplier}x): Applied\n`;
  }

  message += `   ─────────────────────────\n`;
  message += `   TOTAL:            £${pricing.total_amount.toFixed(2)}\n\n`;
  message += `Valid for 48 hours\n\n`;
  message += `Reply YES to confirm booking`;

  return message;
};

export {
  calculateDisposalQuote,
  calculateQuote,
  clearPricingCache,
  convertDistance,
  formatDisposalQuoteForCustomer,
  formatQuoteForCustomer,
  getPricingRule,
  roundPrice,
};
