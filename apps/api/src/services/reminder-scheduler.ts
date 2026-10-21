import { processFollowUpReminders, type ProcessRemindersResult } from './reminders.js';
import { logger } from '../lib/logger.js';

interface WorkerState {
  isRunning: boolean;
  isSchedulerActive: boolean;
  lastRunAt: string | null;
  lastResult: ProcessRemindersResult | null;
  nextRunAt: string | null;
  intervalTimer: NodeJS.Timeout | null;
}

const state: WorkerState = {
  isRunning: false,
  isSchedulerActive: false,
  lastRunAt: null,
  lastResult: null,
  nextRunAt: null,
  intervalTimer: null,
};

/**
 * Manually or programmatically triggers a reminder processing cycle
 */
export async function triggerReminderCycle(orgId?: string): Promise<ProcessRemindersResult> {
  state.isRunning = true;
  try {
    const result = await processFollowUpReminders(orgId);
    state.lastRunAt = new Date().toISOString();
    state.lastResult = result;
    logger.info({ result }, 'Scheduled reminder processing cycle completed');
    return result;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed during reminder processing cycle');
    throw err;
  } finally {
    state.isRunning = false;
  }
}

/**
 * Starts the background timer/cron worker if configured
 */
export function startReminderScheduler(intervalMs = 15 * 60 * 1000): void {
  if (state.intervalTimer) {
    clearInterval(state.intervalTimer);
  }

  state.isSchedulerActive = true;
  state.nextRunAt = new Date(Date.now() + intervalMs).toISOString();

  state.intervalTimer = setInterval(async () => {
    try {
      await triggerReminderCycle();
      state.nextRunAt = new Date(Date.now() + intervalMs).toISOString();
    } catch (err) {
      // Handled in triggerReminderCycle
    }
  }, intervalMs);

  logger.info({ intervalMs }, 'Reminder background worker scheduled successfully');
}

/**
 * Stops the background worker
 */
export function stopReminderScheduler(): void {
  if (state.intervalTimer) {
    clearInterval(state.intervalTimer);
    state.intervalTimer = null;
  }
  state.isSchedulerActive = false;
  state.nextRunAt = null;
  logger.info('Reminder background worker stopped');
}

/**
 * Returns accurate operational status of the reminder worker without false claims
 */
export function getReminderWorkerStatus(): {
  scheduler_running: boolean;
  worker_status: 'active' | 'inactive';
  worker_mode: 'scheduled_worker' | 'manual_only';
  last_run_at: string | null;
  last_result: ProcessRemindersResult | null;
  next_run_at: string | null;
} {
  return {
    scheduler_running: state.isSchedulerActive,
    worker_status: state.isSchedulerActive ? 'active' : 'inactive',
    worker_mode: state.isSchedulerActive ? 'scheduled_worker' : 'manual_only',
    last_run_at: state.lastRunAt,
    last_result: state.lastResult,
    next_run_at: state.nextRunAt,
  };
}
