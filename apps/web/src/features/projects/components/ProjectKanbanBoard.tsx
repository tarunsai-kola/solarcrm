import {
  Activity,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  HardHat,
  MapPin,
  ShieldCheck,
  Sun,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react';
import type { ProjectStage, SolarEpcProject } from '../services/epc-projects-service';

interface ProjectKanbanBoardProps {
  projects: SolarEpcProject[];
  onSelectProject: (project: SolarEpcProject) => void;
}

const KANBAN_STAGES: Array<{ id: ProjectStage; title: string; color: string }> = [
  { id: 'site_survey', title: '1. Site Survey & SLD', color: 'border-blue-500/30 bg-blue-500/5' },
  { id: 'discom_sanction', title: '2. DISCOM Sanction', color: 'border-purple-500/30 bg-purple-500/5' },
  { id: 'material_dispatch', title: '3. Material Delivery', color: 'border-indigo-500/30 bg-indigo-500/5' },
  { id: 'installation', title: '4. EPC Installation', color: 'border-amber-500/30 bg-amber-500/5' },
  { id: 'net_meter_testing', title: '5. Net-Meter Testing', color: 'border-cyan-500/30 bg-cyan-500/5' },
  { id: 'commissioning', title: '6. Grid Commissioning', color: 'border-teal-500/30 bg-teal-500/5' },
  { id: 'subsidy_disbursement', title: '7. Subsidy Credited', color: 'border-emerald-500/30 bg-emerald-500/5' },
];

function formatInr(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function ProjectKanbanBoard({ projects, onSelectProject }: ProjectKanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x">
      {KANBAN_STAGES.map((col) => {
        const colProjects = projects.filter((p) => p.currentStage === col.id);

        return (
          <div
            key={col.id}
            className={`flex-shrink-0 w-80 rounded-2xl border ${col.color} p-3 flex flex-col max-h-[75vh]`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 px-1 border-b border-border/60 mb-3">
              <h3 className="text-xs font-bold text-foreground truncate">
                {col.title}
              </h3>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold font-mono">
                {colProjects.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {colProjects.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground/60 text-xs italic">
                  No projects in this stage
                </div>
              ) : (
                colProjects.map((project) => {
                  const completedCount = project.milestones.filter((m) => m.status === 'completed').length;
                  const progressPercent = Math.round((completedCount / project.milestones.length) * 100);

                  return (
                    <div
                      key={project.id}
                      onClick={() => onSelectProject(project)}
                      className="group cursor-pointer rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary/50 hover:shadow-md transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-primary">
                          {project.projectCode}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            project.healthStatus === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : project.healthStatus === 'on_track'
                                ? 'bg-blue-500/15 text-blue-500'
                                : 'bg-rose-500/15 text-rose-500'
                          }`}
                        >
                          {project.healthStatus.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {project.customerName}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3" />
                          <span>{project.city}</span>
                          <span>•</span>
                          <span className="font-semibold text-foreground">{project.systemCapacityKw} kWp</span>
                        </div>
                      </div>

                      {/* DISCOM Tag */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-muted/40 px-2 py-1 rounded">
                        <span>DISCOM: <strong>{project.discomName}</strong></span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Sub: {formatInr(project.subsidyAmount)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Milestones:</span>
                          <span className="font-mono font-bold text-foreground">{completedCount}/7 ({progressPercent}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
