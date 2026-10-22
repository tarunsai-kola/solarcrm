import React, { useState } from 'react';
import {
  X,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MapPin,
  Calendar,
  Share2,
  Printer,
  ShieldCheck,
  Zap,
  Activity,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InverterTelemetryWidget } from './InverterTelemetryWidget';
import { ServiceTicket, TicketStatus } from '../services/service-tickets-service';

interface TicketDetailDrawerProps {
  ticket: ServiceTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, newStatus: TicketStatus, notes?: string | undefined) => void;
}

export function TicketDetailDrawer({
  ticket,
  isOpen,
  onClose,
  onUpdateStatus,
}: TicketDetailDrawerProps) {
  if (!isOpen || !ticket) return null;

  const [resolutionNotes, setResolutionNotes] = useState(ticket.resolution_notes || '');
  const [isResolving, setIsResolving] = useState(false);

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🛠️ *KOLA SOLAR — SERVICE TICKET UPDATE*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Ticket:* #${ticket.ticket_number}\n` +
      `👤 *Customer:* ${ticket.customer_name}\n` +
      `⚙️ *Category:* ${ticket.ticket_type.replace('_', ' ').toUpperCase()}\n` +
      `🚨 *Issue:* ${ticket.title}\n` +
      `📊 *Status:* *${ticket.status.replace('_', ' ').toUpperCase()}*\n` +
      `🔧 *Assigned Engineer:* ${ticket.assigned_technician_name || 'Dispatch Team'} (${ticket.assigned_technician_phone || 'Kola Helpdesk'})\n` +
      (ticket.resolution_notes ? `✅ *Resolution:* ${ticket.resolution_notes}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Kola Software Solar Operations & Maintenance Hub`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleSaveResolution = () => {
    onUpdateStatus(ticket.id, 'resolved', resolutionNotes || 'Service completed and verified on site.');
    setIsResolving(false);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'low':
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/30';
    }
  };

  const statuses: TicketStatus[] = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-card border-l border-border h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getPriorityBadge(ticket.priority)}`}>
                {ticket.priority} Priority
              </span>
              <span className="text-xs font-mono font-bold text-primary">{ticket.ticket_number}</span>
            </div>
            <h2 className="text-lg font-bold text-foreground mt-1">{ticket.title}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span>Customer:</span>
              <strong className="text-foreground">{ticket.customer_name}</strong>
              <span>•</span>
              <span>{ticket.city}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Progression Stepper */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              Ticket Lifecycle Status
            </span>
            <div className="flex items-center justify-between gap-1 overflow-x-auto pt-1">
              {statuses.map((st, idx) => {
                const currentIdx = statuses.indexOf(ticket.status);
                const isPassed = currentIdx >= idx;
                const isCurrent = ticket.status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onUpdateStatus(ticket.id, st)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold'
                        : isPassed
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {isPassed && !isCurrent ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-current" />
                    )}
                    <span className="capitalize">{st.replace('_', ' ')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Inverter Telemetry Widget */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Inverter Telemetry & Core Diagnostics
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                Live Cloud Sync
              </span>
            </div>
            <InverterTelemetryWidget
              telemetry={ticket.inverter_telemetry}
              customerName={ticket.customer_name}
            />
          </div>

          {/* Issue Details & AMC Coverage */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Service Ticket Overview
            </span>
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </div>

              <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">AMC Warranty Coverage</span>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{ticket.amc_plan_name || 'Active AMC'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px]">Solar System Capacity</span>
                  <div className="font-semibold text-foreground font-mono mt-0.5">
                    {ticket.system_capacity_kw} kWp Turnkey Array
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Technician & Visit Date */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Field Technician Dispatch
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px]">Assigned Engineer</span>
                <span className="font-bold text-foreground">
                  {ticket.assigned_technician_name || 'Unassigned'}
                </span>
                {ticket.assigned_technician_phone && (
                  <span className="text-[11px] text-muted-foreground block font-mono">
                    {ticket.assigned_technician_phone}
                  </span>
                )}
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">Scheduled Visit</span>
                <span className="font-semibold text-foreground">
                  {ticket.scheduled_visit_date
                    ? new Date(ticket.scheduled_visit_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Not Scheduled'}
                </span>
              </div>
            </div>
          </div>

          {/* Resolution Section */}
          {ticket.status === 'resolved' || ticket.status === 'closed' ? (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>Ticket Resolved & Verified</span>
              </div>
              <p className="text-xs text-foreground">{ticket.resolution_notes}</p>
              {ticket.resolved_at && (
                <span className="text-[10px] text-muted-foreground block font-mono">
                  Resolved on: {new Date(ticket.resolved_at).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          ) : isResolving ? (
            <div className="p-4 rounded-xl border border-primary/30 bg-card space-y-3 animate-in fade-in">
              <label className="text-xs font-semibold text-foreground block">
                Enter Field Resolution & Work Completed Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Cleared DC earth fault, tested insulation resistance > 100 MOhm, reset inverter and verified normal 4.8kW output."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-input bg-background"
              />
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsResolving(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveResolution} className="bg-emerald-600 text-white">
                  Confirm Resolution
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsResolving(true)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:border-emerald-500"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                <span>Mark as Resolved</span>
              </Button>
            </div>
          )}
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="text-emerald-600 dark:text-emerald-400 hover:border-emerald-500"
            >
              <Share2 className="h-4 w-4 mr-1" />
              <span>WhatsApp Customer</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-1" />
              <span>Print Docket</span>
            </Button>
          </div>

          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
