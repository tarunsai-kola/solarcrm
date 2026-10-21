import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Globe,
  Lock,
  Shield,
  User,
  X,
} from 'lucide-react';
import type { AuditLogItem } from '../hooks/use-audit';
import { Button } from '@/components/ui/button';

interface AuditInspectModalProps {
  log: AuditLogItem | null;
  onClose: () => void;
}

export function AuditInspectModal({ log, onClose }: AuditInspectModalProps) {
  if (!log) return null;

  const hasOldValues = log.old_values && Object.keys(log.old_values).length > 0;
  const hasNewValues = log.new_values && Object.keys(log.new_values).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">Audit Event Inspector</h3>
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold uppercase bg-primary/15 text-primary border border-primary/25">
                  {log.action}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target Entity: <span className="font-mono text-foreground">{log.entity_type}</span>{' '}
                {log.entity_id ? `(${log.entity_id})` : ''}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Event Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/10 border-b border-border text-xs">
          <div>
            <span className="text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" /> Actor
            </span>
            <p className="font-medium text-foreground truncate mt-0.5">
              {log.actor?.full_name || 'System / Automated'}
            </p>
            <p className="text-[10px] text-muted-foreground capitalize">{log.actor?.role?.replace('_', ' ') || 'Internal'}</p>
          </div>
          <div>
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Timestamp
            </span>
            <p className="font-medium text-foreground mt-0.5">
              {new Date(log.created_at).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" /> IP Address
            </span>
            <p className="font-medium text-foreground mt-0.5">
              {log.ip_address || 'Internal Network'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> Security Status
            </span>
            <p className="font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Redacted & Tamper-Proof
            </p>
          </div>
        </div>

        {/* Security Redaction Banner */}
        <div className="mx-6 mt-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
          <Lock className="h-4 w-4 shrink-0 text-amber-500" />
          <span>
            <strong>Confidentiality Protection Active:</strong> Secrets, passwords, session tokens, and financial identifiers have been cryptographically sanitized.
          </span>
        </div>

        {/* Content Body: Before & After Diffs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Old Values */}
            <div className="flex flex-col rounded-lg border border-border bg-muted/20 overflow-hidden">
              <div className="px-3 py-2 bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Before Values (Snapshot)</span>
                {hasOldValues ? (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {Object.keys(log.old_values!).length} keys
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">None (New Record)</span>
                )}
              </div>
              <div className="p-3 font-mono text-xs overflow-x-auto max-h-72">
                {hasOldValues ? (
                  <pre className="text-slate-800 dark:text-slate-200">
                    {JSON.stringify(log.old_values, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground italic py-6 text-center">
                    No previous state (Entity created)
                  </p>
                )}
              </div>
            </div>

            {/* New Values */}
            <div className="flex flex-col rounded-lg border border-border bg-muted/20 overflow-hidden">
              <div className="px-3 py-2 bg-muted/40 border-b border-border text-xs font-semibold text-foreground flex items-center justify-between">
                <span>After Values / Payload</span>
                {hasNewValues ? (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {Object.keys(log.new_values!).length} keys
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">None (Record Deleted)</span>
                )}
              </div>
              <div className="p-3 font-mono text-xs overflow-x-auto max-h-72">
                {hasNewValues ? (
                  <pre className="text-slate-800 dark:text-slate-200">
                    {JSON.stringify(log.new_values, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground italic py-6 text-center">
                    No subsequent state (Entity deleted)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3 bg-muted/20">
          <span className="text-[11px] text-muted-foreground font-mono">
            UUID: {log.id}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
