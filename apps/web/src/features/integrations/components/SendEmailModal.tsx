import React, { useState } from 'react';
import {
  Check,
  FileText,
  Mail,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useIntegrationStatus, useSendEmail } from '../hooks/use-integrations';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  customerName?: string | undefined;
  customerEmail?: string | undefined;
  leadArea?: string | undefined;
}

export function SendEmailModal({
  isOpen,
  onClose,
  leadId,
  customerName = 'Customer',
  customerEmail = '',
  leadArea,
}: SendEmailModalProps) {
  const { data: integrations } = useIntegrationStatus();
  const emailIntegration = integrations?.find((i) => i.provider === 'smtp');
  const isSmtpLive = emailIntegration?.configured ?? false;

  const sendEmailMutation = useSendEmail();

  const [to, setTo] = useState(customerEmail);
  const [templateType, setTemplateType] = useState<
    'consultation_follow_up' | 'site_visit_confirmation' | 'quotation_ready' | 'custom'
  >('consultation_follow_up');

  const getTemplateContent = (type: typeof templateType) => {
    switch (type) {
      case 'consultation_follow_up':
        return {
          subject: 'Following up on your Solar Rooftop Consultation — Sunbeam Solar',
          body: `Dear ${customerName},\n\nThank you for speaking with our solar engineering team regarding your rooftop solar inquiry in ${
            leadArea || 'your area'
          }.\n\nWe would love to schedule a quick 15-minute consultation to evaluate your monthly electricity consumption and estimate your solar generation potential.\n\nPlease let us know a suitable time, or feel free to reply directly to this email.\n\nWarm regards,\nSunbeam Solar Engineering Team`,
        };
      case 'site_visit_confirmation':
        return {
          subject: 'Confirmed: Solar Rooftop Technical Site Survey — Sunbeam Solar',
          body: `Dear ${customerName},\n\nYour technical site survey for rooftop solar feasibility has been scheduled.\n\nOur certified solar engineer will evaluate your shadow-free roof area, structural orientation, and electrical panel connectivity.\n\nPlease let us know if you need to reschedule or have any specific site access instructions.\n\nWarm regards,\nSunbeam Solar Operations Team`,
        };
      case 'quotation_ready':
        return {
          subject: 'Your Customized Solar Rooftop Proposal & Quotation is Ready — Sunbeam Solar',
          body: `Dear ${customerName},\n\nWe have prepared your customized rooftop solar quotation complete with Tier-1 bifacial solar modules, solar inverter specifications, government subsidy deductions, and estimated 25-year financial payback.\n\nYou can review your proposal directly or connect with your advisor for any modifications.\n\nWarm regards,\nSunbeam Solar Sales Team`,
        };
      case 'custom':
      default:
        return {
          subject: `Sunbeam Solar Update for ${customerName}`,
          body: `Dear ${customerName},\n\n`,
        };
    }
  };

  const initial = getTemplateContent('consultation_follow_up');
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTemplateChange = (type: typeof templateType) => {
    setTemplateType(type);
    const t = getTemplateContent(type);
    setSubject(t.subject);
    setBody(t.body);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!to || !to.includes('@')) {
      setErrorMsg('Please enter a valid recipient email address.');
      return;
    }

    try {
      await sendEmailMutation.mutateAsync({
        lead_id: leadId,
        to,
        subject,
        body,
        template_type: templateType,
      });

      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to dispatch email.',
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        {sentSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
              <Check className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Email Dispatched!</h3>
            <p className="text-xs text-muted-foreground">
              Recorded in lead activity timeline and communication log.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Compose Email to Lead
                </h3>
                <p className="text-xs text-muted-foreground">
                  Send structured solar consultation updates
                </p>
              </div>
            </div>

            {/* Provider indicator */}
            {isSmtpLive ? (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-2.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>SMTP Live Transport Active — Outbox delivers directly to recipient.</span>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-2.5 text-xs text-amber-600 dark:text-amber-400">
                <span className="font-semibold">Simulated Delivery Mode:</span> SMTP credentials not configured on server. Communication will be logged to timeline and customer history as simulated.
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                {errorMsg}
              </div>
            )}

            {/* Template Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Template
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'consultation_follow_up', label: 'Consultation' },
                  { id: 'site_visit_confirmation', label: 'Site Survey' },
                  { id: 'quotation_ready', label: 'Quotation Ready' },
                  { id: 'custom', label: 'Custom' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTemplateChange(t.id as any)}
                    className={`px-3 py-2 rounded-xl border text-left transition-all ${
                      templateType === t.id
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Recipient Email *
              </label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="customer@example.com"
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Subject Line *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Message Body *</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Plaintext format
                </span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={7}
                required
                className="w-full rounded-xl border border-border bg-background p-3 text-xs font-sans text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendEmailMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Send className="h-3.5 w-3.5" />
                {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
