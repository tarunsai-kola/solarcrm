import { useEffect, useState } from 'react';
import {
  Activity,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  Filter,
  HardHat,
  Kanban,
  List,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getStoredProjects,
  type ProjectStage,
  type SolarEpcProject,
} from '../services/epc-projects-service';
import { ProjectDetailDrawer } from '../components/ProjectDetailDrawer';
import { ProjectKanbanBoard } from '../components/ProjectKanbanBoard';

function formatInr(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
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

export function ProjectsPage() {
  const [projects, setProjects] = useState<SolarEpcProject[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'board' | 'table'>('table');
  const [selectedProject, setSelectedProject] = useState<SolarEpcProject | null>(null);

  const loadProjects = () => {
    const list = getStoredProjects();
    setProjects(list);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.projectCode.toLowerCase().includes(search.toLowerCase()) ||
      p.discomName.toLowerCase().includes(search.toLowerCase()) ||
      p.consumerNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStage = stageFilter === 'all' || p.currentStage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // Analytics Metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.healthStatus !== 'completed');
  const totalCapacityUnderway = activeProjects.reduce((acc, p) => acc + (p.systemCapacityKw || 0), 0);
  const totalSubsidyAmount = projects.reduce((acc, p) => acc + (p.subsidyAmount || 0), 0);
  const commissionedCount = projects.filter((p) => p.currentStage === 'commissioning' || p.currentStage === 'subsidy_disbursement').length;

  const handleProjectUpdated = (updated: SolarEpcProject) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedProject(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HardHat className="h-6 w-6 text-primary" />
            Post-Sale EPC & DISCOM Net-Metering Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            End-to-end solar project lifecycle: Rooftop structural surveys, DISCOM grid sanctions, material dispatch, bi-directional net metering, and PM Surya Ghar subsidy tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'board' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadProjects}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Metrics Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total EPC Projects</span>
            <HardHat className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{totalProjects}</div>
          <p className="text-[11px] text-muted-foreground font-medium">
            {activeProjects.length} actively in execution
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Capacity in Construction</span>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {totalCapacityUnderway.toFixed(1)} kWp
          </div>
          <p className="text-[11px] text-muted-foreground">
            Across residential & commercial rooftops
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>PM Surya Ghar Subsidies</span>
            <Award className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatInr(totalSubsidyAmount)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Direct Benefit Transfers tracked
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Grid Synchronized / Done</span>
            <CheckCircle2 className="h-4 w-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {commissionedCount} Plants
          </div>
          <p className="text-[11px] text-muted-foreground">
            Generating live green solar power
          </p>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, project #, consumer ID, DISCOM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Stage Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'all', label: 'All Stages' },
            { id: 'site_survey', label: '1. Survey' },
            { id: 'discom_sanction', label: '2. DISCOM' },
            { id: 'material_dispatch', label: '3. Delivery' },
            { id: 'installation', label: '4. Installation' },
            { id: 'net_meter_testing', label: '5. Net-Meter' },
            { id: 'commissioning', label: '6. Commissioned' },
            { id: 'subsidy_disbursement', label: '7. Subsidy DBT' },
          ].map((stage) => (
            <button
              key={stage.id}
              onClick={() => setStageFilter(stage.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                stageFilter === stage.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {stage.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── View Switcher: Table or Kanban ── */}
      {viewMode === 'board' ? (
        <ProjectKanbanBoard
          projects={filteredProjects}
          onSelectProject={(p) => setSelectedProject(p)}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-mono uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Project Ref</th>
                  <th className="py-3 px-4">Customer & Location</th>
                  <th className="py-3 px-4">Capacity & System</th>
                  <th className="py-3 px-4">DISCOM & Consumer #</th>
                  <th className="py-3 px-4 text-center">Milestones Progress</th>
                  <th className="py-3 px-4 text-center">Current Stage</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No EPC projects match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => {
                    const completedCount = project.milestones.filter((m) => m.status === 'completed').length;
                    const progressPercent = Math.round((completedCount / project.milestones.length) * 100);

                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedProject(project)}
                      >
                        {/* Project Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-primary">
                          {project.projectCode}
                          <span className="block text-[10px] font-normal text-muted-foreground">
                            Start: {formatDate(project.startDate)}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground">{project.customerName}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {project.city} ({project.pincode})
                          </div>
                        </td>

                        {/* Capacity */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-foreground">
                            {project.systemCapacityKw} kWp
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {project.phase} • {project.systemType}
                          </span>
                        </td>

                        {/* DISCOM */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground">{project.discomName}</div>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {project.consumerNumber}
                          </span>
                        </td>

                        {/* Progress */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-xs">
                              {completedCount}/7 ({progressPercent}%)
                            </span>
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Stage */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                            {project.currentStage.replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              project.healthStatus === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : project.healthStatus === 'on_track'
                                  ? 'bg-blue-500/15 text-blue-500'
                                  : 'bg-rose-500/15 text-rose-500'
                            }`}
                          >
                            {project.healthStatus.replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const cleanPhone = project.customerPhone.replace(/[^0-9]/g, '');
                                window.open(`https://wa.me/${cleanPhone}`, '_blank');
                              }}
                              className="h-7 w-7 p-0 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500"
                              title="WhatsApp Customer"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedProject(project)}
                              className="h-7 text-xs px-2.5 gap-1"
                            >
                              <Wrench className="h-3 w-3" /> Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Project Detail Drawer ── */}
      {selectedProject && (
        <ProjectDetailDrawer
          project={selectedProject}
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          onProjectUpdated={handleProjectUpdated}
        />
      )}
    </div>
  );
}
