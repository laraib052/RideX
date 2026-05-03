// Utility for geospatial calculations

/**
 * Calculates distance between two coordinates in km
 * Uses Haversine formula
 */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Estimates ride fare based on distance
 * Base fare + per-km rate
 */
const estimateFare = (distanceKm) => {
  const BASE_FARE = 50;      // PKR base
  const PER_KM_RATE = 25;    // PKR per km
  return Math.round(BASE_FARE + distanceKm * PER_KM_RATE);
};

module.exports = { getDistance, estimateFare };