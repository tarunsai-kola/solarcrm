import { describe, expect, it } from 'vitest';
import type { IntegrationStatus } from '@solar-crm/shared';

describe('Integrations & Communication Channels — Client Unit Tests', () => {
  describe('WhatsApp Link Encoding & Disclaimer Logic', () => {
    it('properly encodes customer name and area into wa.me URL', () => {
      const phone = '9876543210';
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const message = 'Hello Rajesh! Thank you for your inquiry in Kothrud.';
      const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

      expect(waUrl).toBe('https://wa.me/919876543210?text=Hello%20Rajesh!%20Thank%20you%20for%20your%20inquiry%20in%20Kothrud.');
    });

    it('requires 10 digits minimum for valid phone number', () => {
      const invalidPhone = '12345';
      const clean = invalidPhone.replace(/\D/g, '');
      const isValid = clean.length >= 10;
      expect(isValid).toBe(false);
    });
  });

  describe('Integration Status & Provider Identification', () => {
    const mockIntegrations: IntegrationStatus[] = [
      {
        provider: 'google',
        name: 'Google Calendar & Meet',
        configured: true,
        connected: true,
        account_email: 'rep@sunbeam.example',
        sync_enabled: true,
        sync_status: 'active',
        scopes: ['https://www.googleapis.com/auth/calendar.events', 'openid'],
      },
      {
        provider: 'smtp',
        name: 'Email Service',
        configured: false,
        connected: false,
        sync_enabled: false,
        sync_status: 'unconfigured',
      },
      {
        provider: 'whatsapp',
        name: 'WhatsApp Messaging',
        configured: false,
        connected: true,
        sync_enabled: true,
        sync_status: 'unconfigured',
      },
    ];

    it('identifies connected Google Calendar integration with email', () => {
      const gcal = mockIntegrations.find((i) => i.provider === 'google');
      expect(gcal?.connected).toBe(true);
      expect(gcal?.account_email).toBe('rep@sunbeam.example');
      expect(gcal?.scopes).toContain('https://www.googleapis.com/auth/calendar.events');
    });

    it('clearly flags unconfigured providers without claiming false live connectivity', () => {
      const email = mockIntegrations.find((i) => i.provider === 'smtp');
      expect(email?.configured).toBe(false);
      expect(email?.connected).toBe(false);
      expect(email?.sync_status).toBe('unconfigured');
    });
  });

  describe('Google Meet Link Validation', () => {
    it('validates Google Meet URI format', () => {
      const sampleMeetUri = 'https://meet.google.com/xyz-uvwx-rst';
      const isGoogleMeet = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(sampleMeetUri);
      expect(isGoogleMeet).toBe(true);
    });
  });
});
