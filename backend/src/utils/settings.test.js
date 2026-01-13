import { jest } from '@jest/globals';

// Mock Redis config so importing settings.js does not require real Upstash env vars
jest.unstable_mockModule('../config/redis.js', () => ({
  default: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

// Dynamically import after mocking to ensure the mock is applied
const { getDefaultSettings } = await import('./settings.js');

describe('getDefaultSettings', () => {
  it('returns an object with expected top-level keys', () => {
    const settings = getDefaultSettings();

    expect(settings).toHaveProperty('business');
    expect(settings).toHaveProperty('pricingTeam');
    expect(settings).toHaveProperty('whatsapp');
    expect(settings).toHaveProperty('ai');
    expect(settings).toHaveProperty('quotes');
    expect(settings).toHaveProperty('pricingRules');
    expect(settings).toHaveProperty('notifications');
  });

  it('falls back to default business values when env vars are not set', () => {
    const settings = getDefaultSettings();

    expect(settings.business.name).toBe('JT Chauffeur Services');
    expect(settings.business.phone).toBe('+447700900000');
    expect(settings.business.email).toBe('bookings@jtchauffeur.com');
    expect(settings.business.whatsapp).toBe('+447700900000');
  });
});

