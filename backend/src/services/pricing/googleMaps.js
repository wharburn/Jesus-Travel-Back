import axios from 'axios';
import 'dotenv/config';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const DISTANCE_MATRIX_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

/**
 * Geocode an address to get latitude and longitude
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number, formatted_address: string}>}
 */
const geocodeAddress = async (address) => {
  try {
    const response = await axios.get(GEOCODING_API_URL, {
      params: {
        address: address,
        key: GOOGLE_MAPS_API_KEY,
        region: 'uk', // Bias results to UK
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }

    const result = response.data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address,
    };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    throw new Error(`Failed to geocode address: ${address}`);
  }
};

/**
 * Calculate distance and duration between two locations
 * @param {string} origin - Origin address or coordinates
 * @param {string} destination - Destination address or coordinates
 * @param {Date} departureTime - Optional departure time for traffic-aware routing
 * @returns {Promise<{distance_km: number, duration_minutes: number, distance_text: string, duration_text: string}>}
 */
const calculateDistance = async (origin, destination, departureTime = null) => {
  try {
    const params = {
      origins: origin,
      destinations: destination,
      key: GOOGLE_MAPS_API_KEY,
      units: 'metric',
      mode: 'driving',
    };

    // Add departure time for traffic-aware routing
    if (departureTime) {
      params.departure_time = Math.floor(departureTime.getTime() / 1000);
    }

    const response = await axios.get(DISTANCE_MATRIX_API_URL, { params });

    if (response.data.status !== 'OK') {
      throw new Error(`Distance Matrix API failed: ${response.data.status}`);
    }

    const element = response.data.rows[0].elements[0];

    if (element.status !== 'OK') {
      throw new Error(`Route calculation failed: ${element.status}`);
    }

    return {
      distance_km: (element.distance.value / 1000).toFixed(2), // Convert meters to km
      duration_minutes: Math.ceil(element.duration.value / 60), // Convert seconds to minutes
      distance_text: element.distance.text,
      duration_text: element.duration.text,
      distance_meters: element.distance.value,
      duration_seconds: element.duration.value,
    };
  } catch (error) {
    console.error('Distance calculation error:', error.message);
    throw new Error('Failed to calculate distance');
  }
};

/**
 * Get full journey details (geocoding + distance calculation)
 * @param {string} pickupAddress - Pickup location
 * @param {string} dropoffAddress - Dropoff location
 * @param {Date} pickupTime - Pickup time for traffic-aware routing
 * @returns {Promise<Object>}
 */
const getJourneyDetails = async (pickupAddress, dropoffAddress, pickupTime = null) => {
  try {
    console.log(`🗺️  Getting journey details: ${pickupAddress} → ${dropoffAddress}`);

    // Geocode both addresses in parallel
    const [pickup, dropoff] = await Promise.all([
      geocodeAddress(pickupAddress),
      geocodeAddress(dropoffAddress),
    ]);

    // Calculate distance using coordinates for accuracy
    const pickupCoords = `${pickup.lat},${pickup.lng}`;
    const dropoffCoords = `${dropoff.lat},${dropoff.lng}`;

    const distance = await calculateDistance(pickupCoords, dropoffCoords, pickupTime);

    return {
      pickup: {
        address: pickupAddress,
        formatted_address: pickup.formatted_address,
        lat: pickup.lat,
        lng: pickup.lng,
      },
      dropoff: {
        address: dropoffAddress,
        formatted_address: dropoff.formatted_address,
        lat: dropoff.lat,
        lng: dropoff.lng,
      },
      distance: {
        km: parseFloat(distance.distance_km),
        meters: distance.distance_meters,
        text: distance.distance_text,
      },
      duration: {
        minutes: distance.duration_minutes,
        seconds: distance.duration_seconds,
        text: distance.duration_text,
      },
    };
  } catch (error) {
    console.error('Journey details error:', error.message);
    throw error;
  }
};

/**
 * Reverse geocode coordinates to get address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>}
 */
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await axios.get(GEOCODING_API_URL, {
      params: {
        latlng: `${lat},${lng}`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Reverse geocoding failed: ${response.data.status}`);
    }

    return response.data.results[0].formatted_address;
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    throw new Error('Failed to reverse geocode coordinates');
  }
};

export { calculateDistance, geocodeAddress, getJourneyDetails, reverseGeocode };
