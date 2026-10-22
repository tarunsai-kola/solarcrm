import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Share2,
  Shield,
  Trash2,
  User,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useLandingInquiries } from '../hooks/use-landing-inquiries';
import type { InquiryStatus, LandingInquiry } from '../services/landing-leads-service';

interface InquiryDetailDrawerProps {
  inquiry: LandingInquiry | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAssignModal: (inquiry: LandingInquiry) => void;
}

const STATUS_LABELS: Record<InquiryStatus, { label: string; color: string }> = {
  new: { label: 'New Inquiry', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  assigned: { label: 'Assigned to Sales', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  contacted: { label: 'Contacted', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  demo_scheduled: { label: 'Demo Scheduled', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  converted: { label: 'Converted to Deal', color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  disqualified: { label: 'Disqualified', color: 'bg-slate-700 text-slate-400 border-slate-600' },
};

export function InquiryDetailDrawer({
  inquiry,
  isOpen,
  onClose,
  onOpenAssignModal,
}: InquiryDetailDrawerProps) {
  const { changeStatus, addNote, removeInquiry } = useLandingInquiries();
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  if (!isOpen || !inquiry) return null;

  const statusConfig = STATUS_LABELS[inquiry.status] || STATUS_LABELS.new;

  const handleStatusChange = (newStatus: InquiryStatus) => {
    changeStatus(inquiry.id, newStatus, `Status updated to ${newStatus}`);
    toast({
      title: 'Status Updated',
      description: `Inquiry status changed to "${STATUS_LABELS[newStatus]?.label}".`,
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    addNote(inquiry.id, newNote.trim());
    setNewNote('');
    setIsAddingNote(false);
    toast({
      title: 'Note Recorded',
      description: 'Activity note added to this lead inquiry.',
    });
  };

  const handlePushToCrm = () => {
    toast({
      title: 'Synchronized to Core CRM Pipeline',
      description: `Inquiry #${inquiry.id} for "${inquiry.customer_name}" is now synced with field sales dispatch.`,
    });
  };

  const cleanPhone = inquiry.phone.replace(/[^\d+]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
    `Hello ${inquiry.customer_name}, thank you for contacting Kola Software regarding Solar VCRM solutions for ${inquiry.company_name || 'your solar project'}.`,
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{inquiry.customer_name}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ref: <span className="font-mono text-amber-400">{inquiry.id}</span> • Received{' '}
                {new Date(inquiry.created_at).toLocaleDateString()} at{' '}
                {new Date(inquiry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Contact & Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <a
              href={`tel:${cleanPhone}`}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Call Phone</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-semibold text-emerald-400 border border-emerald-500/30 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </a>

            <a
              href={`mailto:${inquiry.email}?subject=Kola%20Software%20Solar%20VCRM%20Demo`}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
            >
              <Mail className="w-4 h-4 text-blue-400" />
              <span>Send Email</span>
            </a>
          </div>

          {/* Salesperson Assignment Card */}
          <Card className="p-4 bg-slate-950/70 border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-400" />
                Assigned Salesperson
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenAssignModal(inquiry)}
                className="text-xs h-7 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
              >
                {inquiry.assigned_salesperson_id ? 'Reassign Rep' : 'Assign Salesperson'}
              </Button>
            </div>

            {inquiry.assigned_salesperson_id ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                  {inquiry.assigned_salesperson_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{inquiry.assigned_salesperson_name}</h4>
                  <p className="text-xs text-amber-400/90 font-medium">
                    {inquiry.assigned_salesperson_role || 'Solar Sales Specialist'}
                  </p>
                  <p className="text-[11px] text-slate-400">{inquiry.assigned_salesperson_email}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-900 border border-dashed border-slate-700 text-center text-xs text-slate-400">
                ⚠️ No salesperson assigned yet. Click "Assign Salesperson" to allocate this lead.
              </div>
            )}
          </Card>

          {/* Form Captured Fields (Full Address, Company, etc.) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Form Submission Details
            </h4>

            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-slate-500 block">Full Name:</span>
                  <span className="font-semibold text-white text-sm">{inquiry.customer_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Company Name:</span>
                  <span className="font-semibold text-white text-sm">{inquiry.company_name || 'Individual'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-slate-500 block">Phone:</span>
                  <span className="font-mono text-white">{inquiry.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Email:</span>
                  <span className="text-white truncate block">{inquiry.email}</span>
                </div>
              </div>

              {/* Exact Address Highlight (as requested by user) */}
              <div className="pb-3 border-b border-slate-800">
                <span className="text-slate-500 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Full Site Address / Location:
                </span>
                <p className="text-white font-medium bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  {inquiry.address || 'Address not provided'}
                </p>
                {(inquiry.city || inquiry.state) && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    City/State: {inquiry.city}, {inquiry.state} {inquiry.pincode ? `(${inquiry.pincode})` : ''}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-slate-500 block">Business Category:</span>
                  <span className="text-amber-400 font-semibold uppercase">{inquiry.business_type || 'EPC'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Monthly Inquiries:</span>
                  <span className="text-white">{inquiry.lead_volume || 'Standard'}</span>
                </div>
              </div>

              {inquiry.system_interest && (
                <div className="pb-3 border-b border-slate-800">
                  <span className="text-slate-500 block">System Interest / Capacity:</span>
                  <span className="text-white font-medium">{inquiry.system_interest}</span>
                </div>
              )}

              {inquiry.notes && (
                <div>
                  <span className="text-slate-500 block mb-1">Customer Message / Requirements:</span>
                  <p className="text-slate-300 italic bg-slate-900/60 p-2 rounded border border-slate-800 text-xs">
                    "{inquiry.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status Controls */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Pipeline Stage & Status
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(STATUS_LABELS) as InquiryStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                    inquiry.status === st
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {STATUS_LABELS[st].label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Log & Internal Notes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Activity Log & Audit Trail
            </h4>

            {/* Add note input */}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Log a call, WhatsApp feedback, or internal memo..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shrink-0">
                <Send className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </form>

            <div className="space-y-2 pt-1">
              {inquiry.activity_log.map((act) => (
                <div key={act.id} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-white">{act.action}</span>
                    <span className="text-slate-500">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    By <span className="text-amber-400">{act.actor}</span>
                    {act.details ? ` — ${act.details}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this inquiry record?')) {
                removeInquiry(inquiry.id);
                onClose();
                toast({ title: 'Inquiry Removed', description: `Record #${inquiry.id} deleted.` });
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </Button>

          <Button
            onClick={handlePushToCrm}
            className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold"
          >
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Push to Main Solar CRM Leads
          </Button>
        </div>
      </div>
    </div>
  );
}
