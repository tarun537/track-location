import { describe, it, expect } from 'vitest';
import {
  calculateDistanceMeters,
  formatRelativeTime,
  headingToCardinal,
  formatSpeedKmH,
} from '../lib/geoMath';

describe('geoMath utility module', () => {
  it('correctly calculates Haversine distance between two coordinates', () => {
    // New York City to London (~5,570 km)
    const distNYCtoLondon = calculateDistanceMeters(40.7128, -74.006, 51.5074, -0.1278);
    expect(distNYCtoLondon).toBeGreaterThan(5500000);
    expect(distNYCtoLondon).toBeLessThan(5600000);

    // Identical point distance should be 0
    expect(calculateDistanceMeters(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });

  it('correctly formats relative time', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 2000)).toBe('Just now');
    expect(formatRelativeTime(now - 30000)).toBe('30s ago');
    expect(formatRelativeTime(now - 120000)).toBe('2m ago');
  });

  it('correctly converts degrees to cardinal directions', () => {
    expect(headingToCardinal(0)).toBe('N');
    expect(headingToCardinal(45)).toBe('NE');
    expect(headingToCardinal(90)).toBe('E');
    expect(headingToCardinal(180)).toBe('S');
    expect(headingToCardinal(270)).toBe('W');
    expect(headingToCardinal(null)).toBe('N/A');
    expect(headingToCardinal(undefined)).toBe('N/A');
  });

  it('correctly formats ground speed in km/h', () => {
    expect(formatSpeedKmH(10)).toBe('36.0 km/h');
    expect(formatSpeedKmH(0)).toBe('0.0 km/h');
    expect(formatSpeedKmH(null)).toBe('0.0 km/h');
    expect(formatSpeedKmH(undefined)).toBe('0.0 km/h');
  });
});

