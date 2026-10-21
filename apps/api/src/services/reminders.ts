import { supabaseAdmin } from '../lib/supabase.js';

export interface ProcessRemindersResult {
  total_checked: number;
  due_today_count: number;
  overdue_count: number;
  due_soon_count: number;
  notifications_sent: number;
  duplicates_skipped: number;
}

/**
 * Scans active follow-ups and generates in-app notifications for:
 * - Overdue follow-ups
 * - Follow-ups due today
 * - Follow-ups due soon (within next 24 hours)
 *
 * Implements strict deduplication so identical reminder notifications
 * are not spammed within a 24-hour cycle.
 */
export async function processFollowUpReminders(orgId?: string): Promise<ProcessRemindersResult> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // 1. Fetch pending follow-ups with lead and assignee details
  let query = supabaseAdmin
    .from('follow_ups')
    .select(`
      id,
      organization_id,
      lead_id,
      assigned_to,
      due_at,
      status,
      reminder_status,
      notes,
      lead:leads!lead_id(id, customer_name, phone, area)
    `)
    .in('status', ['pending', 'rescheduled']);

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  const { data: followUps, error } = await query;
  if (error || !followUps) {
    return {
      total_checked: 0,
      due_today_count: 0,
      overdue_count: 0,
      due_soon_count: 0,
      notifications_sent: 0,
      duplicates_skipped: 0,
    };
  }

  let dueTodayCount = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;
  let notificationsSent = 0;
  let duplicatesSkipped = 0;

  for (const f of followUps) {
    if (!f.due_at || !f.assigned_to) continue;

    const dueDate = new Date(f.due_at);
    let reminderType: 'followup_overdue' | 'followup_due_today' | 'followup_due_soon' | null = null;
    let title = '';
    let body = '';

    const leadName = (f.lead as any)?.customer_name || 'Customer';
    const phone = (f.lead as any)?.phone || '';

    if (dueDate < now) {
      reminderType = 'followup_overdue';
      overdueCount++;
      title = `Overdue Follow-up: ${leadName}`;
      body = `Follow-up with ${leadName} (${phone}) was due at ${dueDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })}. Please complete or reschedule.`;
    } else if (dueDate >= startOfToday && dueDate <= endOfToday) {
      reminderType = 'followup_due_today';
      dueTodayCount++;
      title = `Follow-up Due Today: ${leadName}`;
      body = `You have a scheduled follow-up with ${leadName} today at ${dueDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })}.`;
    } else if (dueDate > now && dueDate <= next24Hours) {
      reminderType = 'followup_due_soon';
      dueSoonCount++;
      title = `Upcoming Follow-up Soon: ${leadName}`;
      body = `Reminder: Follow-up scheduled with ${leadName} within the next 24 hours.`;
    }

    if (!reminderType) continue;

    // Deduplication check: Has a notification of this type been generated for this follow-up recently?
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingNotification } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', f.assigned_to)
      .eq('type', reminderType)
      .gte('created_at', oneDayAgo)
      .eq('metadata->>follow_up_id', f.id)
      .limit(1)
      .single();

    if (existingNotification) {
      duplicatesSkipped++;
      continue;
    }

    // Insert in-app notification
    await supabaseAdmin.from('notifications').insert({
      organization_id: f.organization_id,
      user_id: f.assigned_to,
      type: reminderType,
      title,
      body,
      metadata: {
        follow_up_id: f.id,
        lead_id: f.lead_id,
        customer_name: leadName,
        due_at: f.due_at,
      },
      created_at: now.toISOString(),
    });

    notificationsSent++;
  }

  return {
    total_checked: followUps.length,
    due_today_count: dueTodayCount,
    overdue_count: overdueCount,
    due_soon_count: dueSoonCount,
    notifications_sent: notificationsSent,
    duplicates_skipped: duplicatesSkipped,
  };
}
