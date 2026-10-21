import { env } from '../config/env.js';
import { supabaseAdmin } from '../lib/supabase.js';

export interface WhatsAppMessageInput {
  lead_id: string;
  phone: string;
  template_type: 'greeting' | 'site_visit_confirmation' | 'follow_up' | 'quotation_ready' | 'custom';
  custom_text?: string;
  customer_name?: string;
  area?: string;
  visit_time?: string;
  automated_send?: boolean;
}

export interface WhatsAppPreparationResult {
  wa_link: string;
  phone: string;
  formatted_phone: string;
  message_text: string;
  automated_sent: boolean;
  disclaimer: string;
  details: string;
}

/**
 * Normalizes phone numbers to international E.164 format without special characters.
 * Defaults Indian 10-digit numbers to +91 prefix.
 */
export function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

export const WHATSAPP_TEMPLATES = {
  greeting: (name: string, area?: string) =>
    `Hello ${name}! Thank you for your interest in Sunbeam Rooftop Solar${
      area ? ` in ${area}` : ''
    }. I am your solar consultant and would be happy to share details on electricity bill savings, subsidies, and rooftop solar packages. When would be a convenient time for a quick call?`,

  site_visit_confirmation: (name: string, visitTime?: string) =>
    `Hello ${name}! Your Sunbeam Solar technical site assessment has been scheduled${
      visitTime ? ` for ${visitTime}` : ''
    }. Our certified field engineer will survey your roof orientation and electrical setup. Please let us know if you need to reschedule!`,

  follow_up: (name: string) =>
    `Hi ${name}, following up regarding your solar rooftop inquiry. We are offering exclusive subsidy processing support this month. Would you like us to share a preliminary savings calculation?`,

  quotation_ready: (name: string) =>
    `Hi ${name}! Your customized solar proposal & quotation is ready for review with Tier-1 bifacial panels, inverter warranty, and government subsidy breakdown. Let us know when you'd like to review it together!`,

  custom: (_name: string, customText?: string) =>
    customText || 'Hello from Sunbeam Solar. How can we assist you today?',
};

/**
 * Checks if official WhatsApp Business Platform credentials are fully configured.
 */
export function isWhatsAppBusinessConfigured(): boolean {
  return Boolean(env.WHATSAPP_API_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Prepares the WhatsApp deep-link or dispatches via WhatsApp Business Cloud API.
 * Automatically appends the communication record to lead_activities and communication_logs.
 */
export async function prepareWhatsAppMessage(
  userId: string,
  orgId: string,
  input: WhatsAppMessageInput,
): Promise<WhatsAppPreparationResult> {
  const formattedPhone = formatWhatsAppPhone(input.phone);
  const name = input.customer_name || 'Customer';

  let messageText = '';
  switch (input.template_type) {
    case 'greeting':
      messageText = WHATSAPP_TEMPLATES.greeting(name, input.area);
      break;
    case 'site_visit_confirmation':
      messageText = WHATSAPP_TEMPLATES.site_visit_confirmation(name, input.visit_time);
      break;
    case 'follow_up':
      messageText = WHATSAPP_TEMPLATES.follow_up(name);
      break;
    case 'quotation_ready':
      messageText = WHATSAPP_TEMPLATES.quotation_ready(name);
      break;
    case 'custom':
    default:
      messageText = WHATSAPP_TEMPLATES.custom(name, input.custom_text);
      break;
  }

  const encodedText = encodeURIComponent(messageText);
  const waLink = `https://wa.me/${formattedPhone}?text=${encodedText}`;

  const hasBusinessApi = isWhatsAppBusinessConfigured();
  let automatedSent = false;
  let status: 'sent' | 'simulated' | 'unconfigured' = 'simulated';
  let details = 'Generated wa.me pre-filled message link. User opens WhatsApp Web or App to send.';

  if (input.automated_send && hasBusinessApi) {
    // Automated send via WhatsApp Cloud API
    try {
      const apiRes = await fetch(
        `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: { body: messageText },
          }),
        },
      );

      if (apiRes.ok) {
        automatedSent = true;
        status = 'sent';
        details = 'Dispatched via WhatsApp Business Cloud API.';
      } else {
        status = 'unconfigured';
        details = 'WhatsApp Cloud API call returned error; fallen back to manual link.';
      }
    } catch (err) {
      status = 'unconfigured';
      details = 'WhatsApp Cloud API network error; fallen back to manual link.';
    }
  }

  // 1. Record in communication_logs
  await supabaseAdmin.from('communication_logs').insert({
    organization_id: orgId,
    lead_id: input.lead_id,
    user_id: userId,
    channel: 'whatsapp',
    recipient: `+${formattedPhone}`,
    subject: `WhatsApp: ${input.template_type}`,
    body_snippet: messageText.slice(0, 300),
    status,
    provider: automatedSent ? 'whatsapp-cloud-api' : 'wa-me-link',
    provider_message_id: `wa-${Date.now()}`,
    metadata: {
      template_type: input.template_type,
      wa_link: waLink,
      details,
    },
    created_at: new Date().toISOString(),
  });

  // 2. Append to lead_activities
  await supabaseAdmin.from('lead_activities').insert({
    organization_id: orgId,
    lead_id: input.lead_id,
    author_id: userId,
    activity_type: 'whatsapp',
    outcome: automatedSent ? 'Automated Message Sent' : 'WhatsApp Link Opened',
    notes: `WhatsApp message prepared for +${formattedPhone} (${input.template_type}). Note: Opening WhatsApp does not confirm customer delivery until sent by agent.`,
    occurred_at: new Date().toISOString(),
  });

  return {
    wa_link: waLink,
    phone: input.phone,
    formatted_phone: formattedPhone,
    message_text: messageText,
    automated_sent: automatedSent,
    disclaimer:
      'Opening WhatsApp opens your WhatsApp Web or mobile application with the pre-filled message. The message is NOT automatically sent until you review and click send inside WhatsApp.',
    details,
  };
}
