import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  ExternalLink,
  MessageSquare,
  Sparkles,
  X,
} from 'lucide-react';
import { useIntegrationStatus, usePrepareWhatsApp } from '../hooks/use-integrations';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  customerName?: string | undefined;
  customerPhone?: string | undefined;
  leadArea?: string | undefined;
}

export function WhatsAppModal({
  isOpen,
  onClose,
  leadId,
  customerName = 'Customer',
  customerPhone = '',
  leadArea,
}: WhatsAppModalProps) {
  const { data: integrations } = useIntegrationStatus();
  const waIntegration = integrations?.find((i) => i.provider === 'whatsapp');
  const hasCloudApi = waIntegration?.configured ?? false;

  const prepareMutation = usePrepareWhatsApp();

  const [phone, setPhone] = useState(customerPhone);
  const [templateType, setTemplateType] = useState<
    'greeting' | 'site_visit_confirmation' | 'follow_up' | 'quotation_ready' | 'custom'
  >('greeting');
  const [customText, setCustomText] = useState('');
  const [automatedSend, setAutomatedSend] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const getTemplatePreview = () => {
    switch (templateType) {
      case 'greeting':
        return `Hello ${customerName}! Thank you for your interest in Sunbeam Rooftop Solar${
          leadArea ? ` in ${leadArea}` : ''
        }. I am your solar consultant and would be happy to share details on electricity bill savings, subsidies, and rooftop solar packages. When would be a convenient time for a quick call?`;
      case 'site_visit_confirmation':
        return `Hello ${customerName}! Your Sunbeam Solar technical site assessment has been scheduled. Our certified field engineer will survey your roof orientation and electrical setup. Please let us know if you need to reschedule!`;
      case 'follow_up':
        return `Hi ${customerName}, following up regarding your solar rooftop inquiry. We are offering exclusive subsidy processing support this month. Would you like us to share a preliminary savings calculation?`;
      case 'quotation_ready':
        return `Hi ${customerName}! Your customized solar proposal & quotation is ready for review with Tier-1 bifacial panels, inverter warranty, and government subsidy breakdown. Let us know when you'd like to review it together!`;
      case 'custom':
      default:
        return customText || 'Hello from Sunbeam Solar. How can we assist you today?';
    }
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      const res = await prepareMutation.mutateAsync({
        lead_id: leadId,
        phone,
        template_type: templateType,
        custom_text: templateType === 'custom' ? customText : undefined,
        automated_send: automatedSend && hasCloudApi,
      });

      if (res.automated_sent) {
        onClose();
      } else {
        // Open WhatsApp Web / App
        window.open(res.wa_link, '_blank', 'noopener,noreferrer');
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to prepare WhatsApp message.',
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

        <form onSubmit={handleLaunch} className="space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                WhatsApp Customer Chat
              </h3>
              <p className="text-xs text-muted-foreground">
                Connect with {customerName} on WhatsApp
              </p>
            </div>
          </div>

          {/* CRITICAL Sending Disclaimer */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 flex gap-2.5 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Important Notice:</span> Clicking &ldquo;Open WhatsApp Chat&rdquo; launches WhatsApp with this pre-filled message template. Opening WhatsApp does <strong>NOT</strong> automatically send the message. You must review and press the Send button in WhatsApp.
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Customer Mobile Phone *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Template Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Template Message
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'greeting', label: 'Greeting & Intro' },
                { id: 'site_visit_confirmation', label: 'Site Survey' },
                { id: 'follow_up', label: 'Follow-up Check-in' },
                { id: 'quotation_ready', label: 'Quotation Ready' },
                { id: 'custom', label: 'Custom' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateType(t.id as any)}
                  className={`px-3 py-2 rounded-xl border text-left transition-all ${
                    templateType === t.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom text if custom template */}
          {templateType === 'custom' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Custom Message Text
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          )}

          {/* Message Preview */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Message Preview
            </label>
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs text-foreground font-sans leading-relaxed whitespace-pre-wrap">
              {getTemplatePreview()}
            </div>
          </div>

          {/* Business Platform Toggle (Optional Automated Dispatch) */}
          {hasCloudApi && (
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-foreground rounded-xl bg-muted/40 border border-border p-2.5">
              <input
                type="checkbox"
                checked={automatedSend}
                onChange={(e) => setAutomatedSend(e.target.checked)}
                className="rounded border-border text-emerald-600 focus:ring-emerald-500"
              />
              <span>Send directly via WhatsApp Business Cloud API (Server-Side)</span>
            </label>
          )}

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
              disabled={prepareMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {prepareMutation.isPending
                ? 'Preparing...'
                : automatedSend
                ? 'Send WhatsApp API Message'
                : 'Open WhatsApp Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
