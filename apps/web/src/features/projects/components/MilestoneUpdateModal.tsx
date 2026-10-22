import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  MessageCircle,
  Paperclip,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  generateMilestoneWhatsAppMessage,
  type MilestoneStatus,
  type ProjectMilestone,
  type SolarEpcProject,
} from '../services/epc-projects-service';

interface MilestoneUpdateModalProps {
  project: SolarEpcProject;
  milestone: ProjectMilestone;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: {
    status: MilestoneStatus;
    referenceNumber?: string | undefined;
    notes?: string | undefined;
    attachmentName?: string | undefined;
  }) => void;
}

export function MilestoneUpdateModal({
  project,
  milestone,
  isOpen,
  onClose,
  onSave,
}: MilestoneUpdateModalProps) {
  const [status, setStatus] = useState<MilestoneStatus>(milestone.status);
  const [referenceNumber, setReferenceNumber] = useState(milestone.referenceNumber || '');
  const [notes, setNotes] = useState(milestone.notes || '');
  const [attachmentName, setAttachmentName] = useState(milestone.attachmentName || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      status,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      attachmentName: attachmentName.trim() || undefined,
    });
    onClose();
  };

  const handleSimulateUpload = () => {
    const filename = `${project.customerName.replace(/\s+/g, '_')}_${milestone.stage}_doc.pdf`;
    setAttachmentName(filename);
  };

  const openWhatsAppUpdate = () => {
    const updatedMs: ProjectMilestone = {
      ...milestone,
      status,
      referenceNumber,
      notes,
    };
    const encoded = generateMilestoneWhatsAppMessage(project, updatedMs);
    const cleanPhone = project.customerPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl text-foreground space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
              {project.projectCode} • {project.customerName}
            </span>
            <h3 className="text-base font-bold text-foreground mt-0.5">
              Update Milestone: {milestone.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Selector */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Milestone Status *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'pending', label: 'Pending', color: 'border-slate-500/30 text-slate-400' },
                  { id: 'in_progress', label: 'In Progress', color: 'border-amber-500/40 text-amber-500' },
                  { id: 'completed', label: 'Completed', color: 'border-emerald-500/40 text-emerald-500' },
                  { id: 'delayed', label: 'Delayed', color: 'border-rose-500/40 text-rose-500' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatus(opt.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    status === opt.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : `bg-muted/40 hover:bg-muted ${opt.color}`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference / Serial Number */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Official Reference / Sanction Order / Meter Serial #
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. BESCOM/SANCTION/2026/0894 or MTR-98012"
              className="w-full h-9 px-3 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Document Attachment Simulator */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Supporting Engineering / DISCOM Document
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="No document attached"
                className="flex-1 h-9 px-3 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary font-mono text-[11px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSimulateUpload}
                className="h-9 gap-1 text-xs shrink-0"
              >
                <Upload className="h-3.5 w-3.5" /> Attach File
              </Button>
            </div>
          </div>

          {/* Engineer Notes */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Field Engineer Observations / Milestone Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter technical details, DISCOM inspector comments, or test readings (e.g., earthing resistance 3.2 Ohms)..."
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openWhatsAppUpdate}
              className="h-9 text-xs gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 w-full sm:w-auto"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Client Update
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save Milestone Progress
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
