import { useState } from 'react';
import {
  Activity,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  HardHat,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sun,
  Truck,
  User,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  generateMilestoneWhatsAppMessage,
  type ProjectMilestone,
  type SolarEpcProject,
  updateProjectMilestone,
} from '../services/epc-projects-service';
import { MilestoneUpdateModal } from './MilestoneUpdateModal';

interface ProjectDetailDrawerProps {
  project: SolarEpcProject | null;
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: (project: SolarEpcProject) => void;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatInr(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function ProjectDetailDrawer({
  project,
  isOpen,
  onClose,
  onProjectUpdated,
}: ProjectDetailDrawerProps) {
  const [activeMilestoneToEdit, setActiveMilestoneToEdit] = useState<ProjectMilestone | null>(null);

  if (!isOpen || !project) return null;

  const completedCount = project.milestones.filter((m) => m.status === 'completed').length;
  const progressPercent = Math.round((completedCount / project.milestones.length) * 100);

  const handleSaveMilestone = (updates: any) => {
    if (!activeMilestoneToEdit) return;
    const updated = updateProjectMilestone(project.id, activeMilestoneToEdit.id, updates);
    if (updated) {
      onProjectUpdated(updated);
    }
    setActiveMilestoneToEdit(null);
  };

  const handleSendWhatsAppUpdate = (ms: ProjectMilestone) => {
    const encoded = generateMilestoneWhatsAppMessage(project, ms);
    const cleanPhone = project.customerPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary">
                {project.projectCode}
              </span>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {project.currentStage.replace(/_/g, ' ')}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  project.healthStatus === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    : project.healthStatus === 'on_track'
                      ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                      : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                }`}
              >
                {project.healthStatus.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground mt-1">
              {project.customerName} — {project.systemCapacityKw} kWp {project.systemType} Solar
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Progress Card */}
          <div className="rounded-2xl bg-muted/30 border border-border p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">EPC & DISCOM Milestone Progress:</span>
              <span className="font-bold text-foreground font-mono">
                {completedCount} of {project.milestones.length} Completed ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  progressPercent === 100
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>Target Commissioning: <strong className="text-foreground">{formatDate(project.targetCompletionDate)}</strong></span>
              <span>Assigned Engineer: <strong className="text-foreground">{project.assignedEngineer}</strong></span>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/40 p-3 rounded-xl border border-border">
              <span className="text-[10px] uppercase font-mono text-muted-foreground block">DISCOM & Consumer</span>
              <strong className="text-xs text-foreground block mt-0.5">{project.discomName}</strong>
              <span className="text-[10px] text-muted-foreground font-mono">{project.consumerNumber}</span>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border border-border">
              <span className="text-[10px] uppercase font-mono text-muted-foreground block">System Capacity</span>
              <strong className="text-xs text-foreground block mt-0.5">{project.systemCapacityKw} kWp ({project.phase})</strong>
              <span className="text-[10px] text-muted-foreground">{project.systemType} Rooftop</span>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border border-border">
              <span className="text-[10px] uppercase font-mono text-muted-foreground block">Turnkey Contract</span>
              <strong className="text-xs text-foreground block mt-0.5">{formatInr(project.contractAmount)}</strong>
              <span className="text-[10px] text-muted-foreground">Ref: {project.quotationNumber}</span>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border border-border">
              <span className="text-[10px] uppercase font-mono text-muted-foreground block">PM Surya Ghar Subsidy</span>
              <strong className="text-xs text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {formatInr(project.subsidyAmount)}
              </strong>
              <span className="text-[10px] text-muted-foreground">Direct DBT release</span>
            </div>
          </div>

          {/* Customer Location & Contact */}
          <div className="rounded-xl border border-border p-4 bg-muted/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{project.siteAddress}, {project.city} - {project.pincode}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{project.customerPhone}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const cleanPhone = project.customerPhone.replace(/[^0-9]/g, '');
                window.open(`https://wa.me/${cleanPhone}`, '_blank');
              }}
              className="text-xs gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 shrink-0"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Customer
            </Button>
          </div>

          {/* Milestones Stepper */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <HardHat className="h-4 w-4 text-primary" /> Engineering & DISCOM Execution Milestones
              </h3>
              <span className="text-[11px] text-muted-foreground font-mono">
                Stage by Stage Audit
              </span>
            </div>

            <div className="space-y-3">
              {project.milestones.map((ms, idx) => (
                <div
                  key={ms.id}
                  className={`rounded-xl border p-4 transition-all ${
                    ms.status === 'completed'
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : ms.status === 'in_progress'
                        ? 'bg-amber-500/5 border-amber-500/40 shadow-sm'
                        : ms.status === 'delayed'
                          ? 'bg-rose-500/5 border-rose-500/30'
                          : 'bg-card border-border'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold font-mono">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-foreground">
                          {ms.name}
                        </h4>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                            ms.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : ms.status === 'in_progress'
                                ? 'bg-amber-500/15 text-amber-500'
                                : ms.status === 'delayed'
                                  ? 'bg-rose-500/15 text-rose-500'
                                  : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {ms.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {ms.description}
                      </p>

                      {/* Reference Number & Document */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                        {ms.referenceNumber && (
                          <span className="text-foreground font-mono bg-muted px-2 py-0.5 rounded text-[10px]">
                            Ref: <strong>{ms.referenceNumber}</strong>
                          </span>
                        )}
                        {ms.completedAt && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ Done {formatDate(ms.completedAt)}
                          </span>
                        )}
                        {ms.attachmentName && (
                          <span className="text-primary flex items-center gap-1 font-mono text-[10px]">
                            <FileText className="h-3 w-3" /> {ms.attachmentName}
                          </span>
                        )}
                      </div>

                      {ms.notes && (
                        <p className="text-[11px] text-muted-foreground/90 italic bg-muted/40 p-2 rounded-lg mt-1 border-l-2 border-primary/50">
                          {ms.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendWhatsAppUpdate(ms)}
                        className="h-7 px-2 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        title="Send Milestone Update via WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveMilestoneToEdit(ms)}
                        className="h-7 px-2 text-[11px]"
                      >
                        <Wrench className="h-3 w-3 mr-1" /> Update
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Update Modal */}
      {activeMilestoneToEdit && (
        <MilestoneUpdateModal
          project={project}
          milestone={activeMilestoneToEdit}
          isOpen={Boolean(activeMilestoneToEdit)}
          onClose={() => setActiveMilestoneToEdit(null)}
          onSave={handleSaveMilestone}
        />
      )}
    </>
  );
}
