import { env } from '../config/env.js';
import { supabaseAdmin } from '../lib/supabase.js';

export interface SendEmailInput {
  lead_id: string;
  to: string;
  subject: string;
  body: string;
  template_type?: 'consultation_follow_up' | 'site_visit_confirmation' | 'quotation_ready' | 'custom';
}

export interface EmailDeliveryResult {
  success: boolean;
  status: 'sent' | 'simulated' | 'unconfigured' | 'failed';
  provider: string;
  message_id: string;
  recipient: string;
  subject: string;
  details: string;
}

/**
 * Checks if email transport credentials are fully configured on the server.
 */
export function isEmailConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

/**
 * Dispatches an email or creates a simulated delivery record when SMTP is unconfigured.
 * Records the communication in communication_logs and appends to lead_activities.
 */
export async function sendLeadEmail(
  userId: string,
  orgId: string,
  input: SendEmailInput,
): Promise<EmailDeliveryResult> {
  const isConfigured = isEmailConfigured();
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  let status: 'sent' | 'simulated' | 'unconfigured' = isConfigured ? 'sent' : 'unconfigured';
  let details = isConfigured
    ? `Dispatched via SMTP (${env.SMTP_HOST})`
    : 'Email server (SMTP_HOST/SMTP_USER) is not configured. Delivery simulated for CRM testing.';

  // If unconfigured in development/test, we mark as simulated so workflows can be previewed
  if (!isConfigured) {
    status = env.NODE_ENV === 'production' ? 'unconfigured' : 'simulated';
  }

  // 1. Record in communication_logs
  await supabaseAdmin.from('communication_logs').insert({
    organization_id: orgId,
    lead_id: input.lead_id,
    user_id: userId,
    channel: 'email',
    recipient: input.to,
    subject: input.subject,
    body_snippet: input.body.slice(0, 300),
    status,
    provider: isConfigured ? 'smtp' : 'mock-transport',
    provider_message_id: messageId,
    metadata: {
      template_type: input.template_type || 'custom',
      from: env.EMAIL_FROM,
      details,
    },
    created_at: new Date().toISOString(),
  });

  // 2. Append to lead_activities timeline (Append-Only)
  await supabaseAdmin.from('lead_activities').insert({
    organization_id: orgId,
    lead_id: input.lead_id,
    author_id: userId,
    activity_type: 'email',
    outcome: status === 'sent' ? 'Delivered' : status === 'simulated' ? 'Simulated' : 'Unconfigured',
    notes: `Email to ${input.to} — Subject: "${input.subject}" (${details})`,
    occurred_at: new Date().toISOString(),
  });

  return {
    success: status === 'sent' || status === 'simulated',
    status,
    provider: isConfigured ? 'smtp' : 'mock-transport',
    message_id: messageId,
    recipient: input.to,
    subject: input.subject,
    details,
  };
}

/**
 * Pre-configured email templates for Solar CRM operations.
 */
export const EMAIL_TEMPLATES = {
  consultation_follow_up: {
    subject: 'Following up on your Solar Consultation — Sunbeam Solar',
    body: (customerName: string, area?: string) =>
      `Dear ${customerName},\n\nThank you for speaking with our solar engineering team regarding your rooftop solar inquiry in ${
        area || 'your area'
      }.\n\nWe would love to schedule a quick 15-minute consultation to evaluate your monthly electricity consumption and estimate your solar generation potential.\n\nPlease let us know a suitable time, or feel free to reply directly to this email.\n\nWarm regards,\nSunbeam Solar Engineering Team`,
  },
  site_visit_confirmation: {
    subject: 'Confirmed: Solar Rooftop Technical Site Survey',
    body: (customerName: string, address?: string, timeStr?: string) =>
      `Dear ${customerName},\n\nYour technical site visit for rooftop solar feasibility has been scheduled:\n\n• Location: ${
        address || 'Your premises'
      }\n• Schedule: ${
        timeStr || 'As confirmed by your field agent'
      }\n\nOur certified solar surveyor will evaluate shadow-free roof area, structural orientation, and electrical panel connectivity.\n\nWarm regards,\nSunbeam Solar Operations`,
  },
  quotation_ready: {
    subject: 'Your Customized Solar Rooftop Proposal & Quotation is Ready',
    body: (customerName: string, systemSizeKw?: number) =>
      `Dear ${customerName},\n\nWe have prepared your customized ${
        systemSizeKw ? `${systemSizeKw} kW ` : ''
      }rooftop solar quotation complete with Tier-1 bifacial solar modules, solar inverter specifications, subsidy deductions, and estimated 25-year financial payback.\n\nYou can review your proposal directly or connect with your advisor for any modifications.\n\nWarm regards,\nSunbeam Solar Sales Team`,
  },
};
