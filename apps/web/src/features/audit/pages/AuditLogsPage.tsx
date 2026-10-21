import { useState } from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuditLogs, type AuditLogItem } from '../hooks/use-audit';
import { useExportReport } from '@/features/reports/hooks/use-analytics';
import { AuditInspectModal } from '../components/AuditInspectModal';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  update: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  delete: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  export: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  assign: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  status_change: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  login: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  logout: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [inspectingLog, setInspectingLog] = useState<AuditLogItem | null>(null);

  const { data, isLoading, refetch, isFetching } = useAuditLogs({
    page,
    pageSize: 20,
    action: selectedAction || undefined,
    entity_type: selectedEntity || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  });

  const exportMutation = useExportReport();

  const handleExportCsv = () => {
    exportMutation.mutate({
      type: 'audit_logs',
      from: fromDate || undefined,
      to: toDate || undefined,
    });
  };

  const logs = data?.items || [];
  const filteredLogs = logs.filter((l) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const actorName = l.actor?.full_name?.toLowerCase() || '';
    const entityType = l.entity_type?.toLowerCase() || '';
    const entityId = l.entity_id?.toLowerCase() || '';
    return actorName.includes(s) || entityType.includes(s) || entityId.includes(s);
  });

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Audit Logs & Security Trail
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable, cryptographically recorded audit trail of privileged actions, status modifications, and data exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExportCsv}
            disabled={exportMutation.isPending}
            className="gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportMutation.isPending ? 'Exporting...' : 'Export Audit Log (CSV)'}
          </Button>
        </div>
      </div>

      {/* ── Security Status Banner ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Ledger Immutability</p>
            <p className="text-sm font-semibold text-foreground">Active (SQL Trigger Protected)</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Credential Privacy</p>
            <p className="text-sm font-semibold text-foreground">Passwords & Tokens Redacted</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Audited Events</p>
            <p className="text-sm font-semibold text-foreground">{data?.total ?? '...'}</p>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actor or entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="export">Data Export</option>
            <option value="assign">Lead Assignment</option>
            <option value="status_change">Status Change</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>

          {/* Entity Type Filter */}
          <select
            value={selectedEntity}
            onChange={(e) => {
              setSelectedEntity(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground"
          >
            <option value="">All Entity Types</option>
            <option value="lead">Leads</option>
            <option value="quotation">Quotations</option>
            <option value="follow_up">Follow-ups</option>
            <option value="site_visit">Site Visits</option>
            <option value="company_settings">Company Settings</option>
            <option value="crm_controls">CRM Controls</option>
            <option value="report_leads">Report Exports</option>
          </select>

          {/* From Date */}
          <Input
            type="date"
            placeholder="From Date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="h-9 text-xs"
          />

          {/* To Date */}
          <Input
            type="date"
            placeholder="To Date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actionStyle =
                    ACTION_COLORS[log.action] ||
                    'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono whitespace-nowrap text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-[10px]">
                            {log.actor?.full_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {log.actor?.full_name || 'System / Auto'}
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {log.actor?.role?.replace('_', ' ') || 'Internal'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${actionStyle}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-foreground font-medium">
                          {log.entity_type}
                        </div>
                        {log.entity_id && (
                          <div className="font-mono text-[10px] text-muted-foreground truncate max-w-[140px]">
                            {log.entity_id}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {log.ip_address || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectingLog(log)}
                          className="h-7 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/10 text-xs">
          <span className="text-muted-foreground">
            Showing Page <strong>{data?.page ?? 1}</strong> of <strong>{data?.totalPages ?? 1}</strong> (
            {data?.total ?? 0} total events)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-7 px-2 gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data || page >= data.totalPages}
              className="h-7 px-2 gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Inspect Modal ── */}
      {inspectingLog && (
        <AuditInspectModal
          log={inspectingLog}
          onClose={() => setInspectingLog(null)}
        />
      )}
    </div>
  );
}
