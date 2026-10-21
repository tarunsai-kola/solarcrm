import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

export interface CreateNotificationParams {
  organization_id: string;
  user_id: string;
  type:
    | 'lead_assigned'
    | 'lead_reassigned'
    | 'followup_due'
    | 'followup_due_today'
    | 'followup_overdue'
    | 'task_overdue'
    | 'site_visit_changed'
    | 'activity_shared'
    | 'quotation_status_changed'
    | 'system';
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a persisted in-app notification for an authorized CRM user
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('notifications').insert({
      organization_id: params.organization_id,
      user_id: params.user_id,
      type: params.type,
      title: params.title,
      body: params.body,
      metadata: params.metadata ?? {},
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error({ error, params }, 'Failed to insert in-app notification');
    } else {
      logger.debug(
        { userId: params.user_id, type: params.type, title: params.title },
        'In-app notification created successfully',
      );
    }
  } catch (err: any) {
    logger.error({ err: err.message, params }, 'Error creating notification');
  }
}

/**
 * Triggers notification when a quotation status changes or new version is prepared
 */
export async function notifyQuotationStatusChange(params: {
  organization_id: string;
  quotation_id: string;
  quote_number: string;
  customer_name: string;
  new_status: string;
  actor_id: string;
  assigned_sales_id?: string | null;
  assigned_agent_id?: string | null;
  grand_total?: number;
}): Promise<void> {
  const recipients = new Set<string>();
  if (params.assigned_sales_id && params.assigned_sales_id !== params.actor_id) {
    recipients.add(params.assigned_sales_id);
  }
  if (params.assigned_agent_id && params.assigned_agent_id !== params.actor_id) {
    recipients.add(params.assigned_agent_id);
  }

  const statusLabel = params.new_status.replace('_', ' ').toUpperCase();
  const title = `Quotation ${params.quote_number}: ${statusLabel}`;
  const body = `Quotation for ${params.customer_name} (${
    params.grand_total ? `₹${params.grand_total.toLocaleString('en-IN')}` : ''
  }) is now marked as ${params.new_status}.`;

  for (const recipientId of recipients) {
    await createNotification({
      organization_id: params.organization_id,
      user_id: recipientId,
      type: 'quotation_status_changed',
      title,
      body,
      metadata: {
        quotation_id: params.quotation_id,
        quote_number: params.quote_number,
        customer_name: params.customer_name,
        status: params.new_status,
      },
    });
  }
}

/**
 * Triggers notification when a site visit is scheduled, rescheduled, cancelled, or completed
 */
export async function notifySiteVisitChange(params: {
  organization_id: string;
  visit_id: string;
  lead_id: string;
  customer_name: string;
  change_type: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed';
  scheduled_at: string;
  field_agent_id: string;
  inbound_sales_id?: string | null;
  actor_id: string;
}): Promise<void> {
  const recipients = new Set<string>();
  if (params.field_agent_id && params.field_agent_id !== params.actor_id) {
    recipients.add(params.field_agent_id);
  }
  if (params.inbound_sales_id && params.inbound_sales_id !== params.actor_id) {
    recipients.add(params.inbound_sales_id);
  }

  const formattedTime = new Date(params.scheduled_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const title = `Site Visit ${params.change_type.toUpperCase()}: ${params.customer_name}`;
  const body = `Feasibility inspection for ${params.customer_name} has been ${params.change_type} (${formattedTime}).`;

  for (const recipientId of recipients) {
    await createNotification({
      organization_id: params.organization_id,
      user_id: recipientId,
      type: 'site_visit_changed',
      title,
      body,
      metadata: {
        visit_id: params.visit_id,
        lead_id: params.lead_id,
        change_type: params.change_type,
        scheduled_at: params.scheduled_at,
      },
    });
  }
}

/**
 * Triggers notification when an activity (call log, note, whatsapp) is shared on a multi-assigned lead
 */
export async function notifySharedActivity(params: {
  organization_id: string;
  lead_id: string;
  customer_name: string;
  activity_type: string;
  actor_id: string;
  actor_name: string;
  target_user_id: string;
  notes_snippet?: string;
}): Promise<void> {
  if (params.target_user_id === params.actor_id) return;

  const activityLabel = params.activity_type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `New ${activityLabel} logged on ${params.customer_name}`;
  const body = `${params.actor_name} logged a ${activityLabel}: "${params.notes_snippet?.slice(0, 100) || 'Updated timeline'}"`;

  await createNotification({
    organization_id: params.organization_id,
    user_id: params.target_user_id,
    type: 'activity_shared',
    title,
    body,
    metadata: {
      lead_id: params.lead_id,
      activity_type: params.activity_type,
      actor_id: params.actor_id,
    },
  });
}
