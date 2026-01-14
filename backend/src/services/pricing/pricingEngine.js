import 'dotenv/config';
// import { query } from '../../config/postgres.js'; // Disabled - using in-memory pricing rules
import { getSetting } from '../../utils/settings.js';
import { getJourneyDetails } from './googleMaps.js';
import { getTimeMultiplier } from './timeMultipliers.js';
import { detectJourneyZones } from './zoneDetection.js';

// Default pricing rules (used when settings are missing or invalid)
const DEFAULT_PRICING_RULES = {
  'Standard Sedan': { base_fare: 50.0, per_km_rate: 2.0, max_passengers: 4 },
  'Executive Sedan': { base_fare: 60.0, per_km_rate: 2.5, max_passengers: 4 },
  'Luxury Sedan': { base_fare: 80.0, per_km_rate: 3.0, max_passengers: 4 },
  'Executive MPV': { base_fare: 100.0, per_km_rate: 3.8, max_passengers: 6 },
  'Luxury MPV': { base_fare: 120.0, per_km_rate: 4.5, max_passengers: 7 },
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

  return {
    base_fare: Number.isFinite(baseFare) ? baseFare : fallback.base_fare,
    per_km_rate: Number.isFinite(perKmRate) ? perKmRate : fallback.per_km_rate,
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
      'Standard Sedan': mapSettingToRule(settingsRules, 'standardSedan', 'Standard Sedan'),
      'Executive Sedan': mapSettingToRule(settingsRules, 'executiveSedan', 'Executive Sedan'),
      'Luxury Sedan': mapSettingToRule(settingsRules, 'luxurySedan', 'Luxury Sedan'),
      'Executive MPV': mapSettingToRule(settingsRules, 'executiveMPV', 'Executive MPV'),
      'Luxury MPV': mapSettingToRule(settingsRules, 'luxuryMPV', 'Luxury MPV'),
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
    // Lowercase variants (from booking form)
    saloon: 'Standard Sedan',
    mpv: 'Executive MPV',
    suv: 'Luxury Sedan',
    minibus: 'Luxury MPV',
    // Capitalized variants (legacy)
    Saloon: 'Standard Sedan',
    MPV: 'Executive MPV',
    SUV: 'Luxury Sedan',
    Minibus: 'Luxury MPV',
    // Already correct names (pass through)
    'Standard Sedan': 'Standard Sedan',
    'Executive Sedan': 'Executive Sedan',
    'Luxury Sedan': 'Luxury Sedan',
    'Executive MPV': 'Executive MPV',
    'Luxury MPV': 'Luxury MPV',
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

    // Return detailed quote breakdown
    return {
      // Journey details
      pickup: journey.pickup,
      dropoff: journey.dropoff,
      distance: journey.distance,
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

  let message = `✅ Quote Ready\n\n`;
  message += `📍 From: ${pickup.formatted_address}\n`;
  message += `📍 To: ${dropoff.formatted_address}\n`;
  message += `📏 Distance: ${distance.km} km (~${duration.minutes} mins)\n`;
  message += `🚗 Vehicle: ${vehicle_type}\n\n`;
  message += `💰 Quote Breakdown:\n`;
  message += `   Base Fare:         £${pricing.base_fare.toFixed(2)}\n`;
  message += `   Distance (${distance.km}km): £${pricing.distance_charge.toFixed(2)}\n`;

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

export { calculateQuote, clearPricingCache, formatQuoteForCustomer, getPricingRule, roundPrice };
