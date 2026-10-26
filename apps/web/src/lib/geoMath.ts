/**
 * Calculates the great-circle distance between two coordinates in meters (Haversine formula).
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formats a timestamp into a human-readable relative string.
 */
export function formatRelativeTime(timestamp: number | string | Date): string {
  const time = new Date(timestamp).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - time) / 1000));

  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

/**
 * Converts a compass heading in degrees (0-360) into an 8-point cardinal direction.
 */
export function headingToCardinal(heading?: number | null): string {
  if (heading == null || isNaN(heading)) return 'N/A';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((heading % 360) + 360) % 360 / 45) % 8;
  return directions[index];
}

/**
 * Formats speed from meters/second to km/h with 1 decimal place.
 */
export function formatSpeedKmH(speedMps?: number | null): string {
  if (speedMps == null || isNaN(speedMps) || speedMps < 0) return '0.0 km/h';
  const kmh = speedMps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}
