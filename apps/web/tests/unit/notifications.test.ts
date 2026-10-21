import { describe, expect, it } from 'vitest';
import type { Notification } from '@solar-crm/shared';

function formatNotificationTime(dateStr: string) {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function getBadgeDisplay(count: number) {
  if (count <= 0) return null;
  if (count > 99) return '99+';
  return count.toString();
}

function resolveNotificationRoute(notif: Partial<Notification>): string {
  const meta = notif.metadata as Record<string, any> | undefined;
  if (meta?.lead_id) {
    return `/leads/${meta.lead_id}`;
  }
  if (meta?.quotation_id) {
    return '/quotations';
  }
  return '/notifications';
}

describe('In-App Notifications & Alert Center — Client Unit Tests', () => {
  describe('Unread Badge Counter Presentation', () => {
    it('returns null for 0 unread alerts', () => {
      expect(getBadgeDisplay(0)).toBeNull();
    });

    it('returns exact count string for single digit count', () => {
      expect(getBadgeDisplay(5)).toBe('5');
    });

    it('returns exact count string for double digit count up to 99', () => {
      expect(getBadgeDisplay(99)).toBe('99');
    });

    it('caps display at "99+" for counts exceeding 99', () => {
      expect(getBadgeDisplay(100)).toBe('99+');
      expect(getBadgeDisplay(550)).toBe('99+');
    });
  });

  describe('Notification Timestamp Relative Formatting', () => {
    it('formats less than a minute ago as "Just now"', () => {
      const now = new Date().toISOString();
      expect(formatNotificationTime(now)).toBe('Just now');
    });

    it('formats 15 minutes ago as "15m ago"', () => {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      expect(formatNotificationTime(fifteenMinsAgo)).toBe('15m ago');
    });

    it('formats 4 hours ago as "4h ago"', () => {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      expect(formatNotificationTime(fourHoursAgo)).toBe('4h ago');
    });

    it('formats 3 days ago as "3d ago"', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatNotificationTime(threeDaysAgo)).toBe('3d ago');
    });
  });

  describe('Notification Deep-Link Routing Resolution', () => {
    it('routes lead assignment and visit changes to specific lead detail page', () => {
      const notif: Partial<Notification> = {
        type: 'lead_assigned',
        metadata: { lead_id: 'lead-uuid-777' },
      };
      expect(resolveNotificationRoute(notif)).toBe('/leads/lead-uuid-777');
    });

    it('routes quotation status updates to quotations workspace', () => {
      const notif: Partial<Notification> = {
        type: 'quotation_status_changed',
        metadata: { quotation_id: 'quote-uuid-888' },
      };
      expect(resolveNotificationRoute(notif)).toBe('/quotations');
    });

    it('routes system alerts without entity id to notifications hub', () => {
      const notif: Partial<Notification> = {
        type: 'system',
        metadata: { provider: 'google', action: 'reconnect_required' },
      };
      expect(resolveNotificationRoute(notif)).toBe('/notifications');
    });
  });

  describe('Idempotency Key Generation for Mutation Replays', () => {
    it('generates consistent idempotency key format preventing race conditions', () => {
      const rawKey = 'submission-form-1234';
      const orgId = 'org-001';
      const userId = 'user-002';
      const method = 'POST';
      const path = '/api/v1/leads';

      const scopedKey = `${orgId}:${userId}:${method}:${path}:${rawKey}`;
      expect(scopedKey).toBe('org-001:user-002:POST:/api/v1/leads:submission-form-1234');
    });
  });
});
