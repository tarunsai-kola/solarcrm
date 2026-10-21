import { useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  Flame,
  Globe,
  Layers,
  MapPin,
  PieChart as PieChartIcon,
  RefreshCw,
  Search,
  Shield,
  Sliders,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAgentPerformance,
  useCompanyAnalytics,
  useExportReport,
  useSalesPerformance,
} from '../hooks/use-analytics';
import { CrmControlsTab } from '@/features/settings/components/CrmControlsTab';
import type { AnalyticsFilter } from '@solar-crm/shared';

const FUNNEL_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#eab308', '#ec4899', '#10b981'];
const AGEING_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export function ReportsAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'sales' | 'field' | 'exports'>('company');

  // Filter states
  const [period, setPeriod] = useState<string>('30d');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedTemp, setSelectedTemp] = useState<string>('');
  const [pincodeQuery, setPincodeQuery] = useState<string>('');

  // Drilldown states
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Export states
  const [exportType, setExportType] = useState<
    'leads' | 'sales_performance' | 'agent_performance' | 'quotations' | 'audit_logs'
  >('leads');
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const filterParams: AnalyticsFilter = {
    period: (period as any) || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    lead_source: selectedSource || undefined,
    status: selectedStatus || undefined,
    temperature: (selectedTemp as any) || undefined,
    pincode: pincodeQuery || undefined,
  };

  // Queries
  const {
    data: companyData,
    isLoading: companyLoading,
    refetch: refetchCompany,
    isFetching: isFetchingCompany,
  } = useCompanyAnalytics(filterParams);

  const {
    data: salesData,
    isLoading: salesLoading,
    refetch: refetchSales,
  } = useSalesPerformance(filterParams);

  const {
    data: agentData,
    isLoading: agentLoading,
    refetch: refetchAgent,
  } = useAgentPerformance(filterParams);

  const exportMutation = useExportReport();

  const handleExport = async () => {
    try {
      const res = await exportMutation.mutateAsync({
        type: exportType,
        period: (period as any) || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        lead_source: selectedSource || undefined,
        status: selectedStatus || undefined,
        temperature: selectedTemp || undefined,
        pincode: pincodeQuery || undefined,
      });
      setExportSuccessMsg(`Successfully generated & verified: ${res.filename}`);
      setTimeout(() => setExportSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  const kpis = companyData?.summary_kpis;
  const funnel = companyData?.conversion_funnel || [];
  const sourcesROI = companyData?.sources_campaign_performance || [];
  const ageing = companyData?.lead_ageing_report;
  const pincodePerf = companyData?.pincode_performance || [];
  const trends = companyData?.trends || [];
  const sla = companyData?.follow_up_sla;

  // Selected drilldown rep / agent
  const selectedRep = salesData?.find((r) => r.user_id === selectedRepId) ?? salesData?.[0];
  const selectedAgent = agentData?.find((a) => a.user_id === selectedAgentId) ?? agentData?.[0];

  const ageingChartData = ageing
    ? [
        { name: '0–7 Days (Fresh)', value: ageing.bucket_0_7d },
        { name: '8–14 Days (Active)', value: ageing.bucket_8_14d },
        { name: '15–30 Days (Cooling)', value: ageing.bucket_15_30d },
        { name: '30+ Days (Stale)', value: ageing.bucket_30d_plus },
      ]
    : [];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Executive Analytics & CRM Intelligence
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time conversion funnels, rep leaderboards, SLA compliance, and pipeline governance.
              </p>
            </div>
          </div>
        </div>

        {/* Global Refresh & Export Shortcut */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchCompany();
              refetchSales();
              refetchAgent();
            }}
            disabled={isFetchingCompany}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetchingCompany ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setActiveTab('exports')}
            className="gap-2 text-xs bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            CSV Export Center
          </Button>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <Button
          variant={activeTab === 'company' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('company')}
          className="gap-2 text-xs"
        >
          <Globe className="h-3.5 w-3.5" />
          Company Overview & Pipeline
        </Button>
        <Button
          variant={activeTab === 'sales' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('sales')}
          className="gap-2 text-xs"
        >
          <Users className="h-3.5 w-3.5" />
          Inbound Sales Performance
        </Button>
        <Button
          variant={activeTab === 'field' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('field')}
          className="gap-2 text-xs"
        >
          <UserCheck className="h-3.5 w-3.5" />
          Field Agent Analytics
        </Button>
        <Button
          variant={activeTab === 'exports' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('exports')}
          className="gap-2 text-xs"
        >
          <Sliders className="h-3.5 w-3.5" />
          Export Center & CRM Controls
        </Button>
      </div>

      {/* ── Filters Bar (Shared across analytics tabs) ── */}
      {activeTab !== 'exports' && (
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground font-semibold">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Interactive Analytics Filters</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {/* Period */}
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setFromDate('');
                setToDate('');
              }}
              className="h-8 px-2.5 rounded-lg border border-input bg-background text-foreground text-xs"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="month">Current Month</option>
              <option value="90d">Last 90 Days</option>
              <option value="ytd">Year to Date (YTD)</option>
              <option value="all">All Time History</option>
            </select>

            {/* From Date */}
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPeriod('');
              }}
              className="h-8 text-xs"
              placeholder="From Date"
            />

            {/* To Date */}
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPeriod('');
              }}
              className="h-8 text-xs"
              placeholder="To Date"
            />

            {/* Lead Source */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-input bg-background text-foreground text-xs"
            >
              <option value="">All Sources</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Tata Solar">Tata Solar</option>
              <option value="JustDial">JustDial</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Cold Call">Cold Call</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-input bg-background text-foreground text-xs"
            >
              <option value="">All Statuses</option>
              <option value="new">Fresh</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="site_visit_completed">Site Visit Completed</option>
              <option value="quotation_sent">Quotation Sent</option>
              <option value="won">Won Deals</option>
              <option value="lost">Lost</option>
            </select>

            {/* Pincode Search */}
            <Input
              placeholder="Filter Pincode..."
              value={pincodeQuery}
              onChange={(e) => setPincodeQuery(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: COMPANY OVERVIEW & PIPELINE ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          {/* Summary KPIs Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Total Leads */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                <span>Total Leads</span>
                <Users className="h-3.5 w-3.5 text-blue-500" />
              </p>
              <p className="text-2xl font-bold text-foreground">
                {companyLoading ? '...' : kpis?.total_leads ?? 0}
              </p>
              <span className="text-[10px] text-muted-foreground">Inquiries in scope</span>
            </div>

            {/* Fresh Leads */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                <span>Fresh Leads</span>
                <Clock className="h-3.5 w-3.5 text-amber-500" />
              </p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {companyLoading ? '...' : kpis?.fresh_leads ?? 0}
              </p>
              <span className="text-[10px] text-muted-foreground">Awaiting outreach</span>
            </div>

            {/* Qualified Pipeline */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                <span>Qualified Leads</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {companyLoading ? '...' : kpis?.qualified_leads ?? 0}
              </p>
              <span className="text-[10px] text-muted-foreground">Roof & Bill confirmed</span>
            </div>

            {/* Won Deals */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                <span>Won Deals</span>
                <Award className="h-3.5 w-3.5 text-emerald-500" />
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {companyLoading ? '...' : kpis?.won_leads ?? 0}
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Win Rate: {kpis?.overall_conversion_rate ?? 0}%
              </span>
            </div>

            {/* Won Revenue */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                <span>Won Revenue</span>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              </p>
              <p className="text-xl font-bold text-foreground truncate">
                {companyLoading
                  ? '...'
                  : `₹${((kpis?.won_revenue ?? 0) / 100000).toFixed(2)}L`}
              </p>
              <span className="text-[10px] text-muted-foreground font-mono">
                ₹{(kpis?.won_revenue ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Follow-up SLA */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                <span>Follow-up SLA</span>
                <Shield className="h-3.5 w-3.5 text-cyan-500" />
              </p>
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {companyLoading ? '...' : `${kpis?.follow_up_sla_compliance_rate ?? 100}%`}
              </p>
              <span className="text-[10px] text-muted-foreground">On-time follow-ups</span>
            </div>
          </div>

          {/* Funnel & Source ROI Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Lead Conversion Funnel
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Stage-by-stage progression from fresh inquiry to contracted win.
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                {companyLoading ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2 text-primary" />
                    Calculating funnel...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={funnel}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                      <XAxis type="number" textAnchor="end" fontSize={10} />
                      <YAxis dataKey="stage" type="category" width={110} fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                        formatter={(val: any, _name: any, item: any) => [
                          `${val} leads (${item.payload.conversion_from_start_pct}% of total)`,
                          'Volume',
                        ]}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {funnel.map((_, index) => (
                          <Cell
                            key={`funnel-cell-${index}`}
                            fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Stage Drop-off Indicators */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-border/60 text-center">
                {funnel.map((stg) => (
                  <div key={stg.stage} className="text-[10px] space-y-0.5">
                    <p className="text-muted-foreground truncate">{stg.stage.split(' ')[0]}</p>
                    <p className="font-bold text-foreground">{stg.count}</p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {stg.conversion_from_start_pct}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead Sources & Campaign ROI */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Lead Sources & Campaign Performance
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Acquisition channels ranked by lead volume, won deals, and realized revenue.
                </p>
              </div>

              <div className="h-64 w-full">
                {companyLoading ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2 text-primary" />
                    Aggregating sources...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sourcesROI}
                      margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                      <XAxis dataKey="source" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="total_leads" name="Total Inquiries" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="won_leads" name="Won Deals" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Source ROI Table Snippet */}
              <div className="overflow-x-auto max-h-32">
                <table className="w-full text-left text-[11px] divide-y divide-border">
                  <thead>
                    <tr className="text-muted-foreground font-semibold">
                      <th className="pb-1">Source</th>
                      <th className="pb-1 text-center">Conversion</th>
                      <th className="pb-1 text-right">Won Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sourcesROI.map((s) => (
                      <tr key={s.source}>
                        <td className="py-1 font-medium">{s.source}</td>
                        <td className="py-1 text-center font-semibold text-emerald-600">
                          {s.conversion_rate}%
                        </td>
                        <td className="py-1 text-right font-mono text-foreground">
                          ₹{s.won_revenue.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Lead Ageing & Trends Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ageing Report & Inactivity Alert */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Lead Ageing & Health
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pipeline distribution by creation date and stagnant opportunities.
                </p>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ageingChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {ageingChartData.map((_, index) => (
                        <Cell
                          key={`ageing-${index}`}
                          fill={AGEING_COLORS[index % AGEING_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Ageing legend buckets */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {ageingChartData.map((b, i) => (
                  <div key={b.name} className="flex items-center gap-1.5 p-1.5 rounded bg-muted/20">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: AGEING_COLORS[i] }}
                    />
                    <span className="truncate text-muted-foreground">{b.name}</span>
                    <strong className="ml-auto font-bold text-foreground">{b.value}</strong>
                  </div>
                ))}
              </div>

              {/* Inactivity Flag Card */}
              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Inactivity Alert ({ageing?.inactive_leads ?? 0} leads)
                  </p>
                  <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                    Unclosed inquiries with no communication activity for &gt; 7 days.
                  </p>
                </div>
              </div>
            </div>

            {/* Daily & Weekly Trends */}
            <div className="lg:col-span-2 p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Daily & Weekly Operational Trends
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Leads created, activities logged, and site visits performed over time.
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                    <XAxis
                      dataKey="date"
                      fontSize={10}
                      tickFormatter={(d) => d.slice(5)} // MM-DD
                    />
                    <YAxis fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="leads_created"
                      name="Inquiries Created"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorLeads)"
                    />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      name="Visits Completed"
                      stroke="#eab308"
                      fillOpacity={1}
                      fill="url(#colorVisits)"
                    />
                    <Line
                      type="monotone"
                      dataKey="won_deals"
                      name="Won Deals"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* SLA Compliance Quick Bar */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span>
                    Follow-up SLA Compliance:{' '}
                    <strong className="text-foreground">{sla?.sla_compliance_pct ?? 100}%</strong>
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Average Overdue Delay: <strong>{sla?.avg_delay_hours ?? 0} hrs</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Pincode & Service-Area Performance Table */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Pincode & Service-Area Regional Performance
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lead volume, feasibility visits, and won revenue segmented by postal district.
                </p>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {pincodePerf.length} Pincodes Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-border">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">Pincode</th>
                    <th className="py-2.5 px-3">Service Area</th>
                    <th className="py-2.5 px-3 text-center">Total Inquiries</th>
                    <th className="py-2.5 px-3 text-center">Visits Completed</th>
                    <th className="py-2.5 px-3 text-center">Won Deals</th>
                    <th className="py-2.5 px-3 text-center">Win Rate (%)</th>
                    <th className="py-2.5 px-3 text-right">Won Revenue (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {pincodePerf.slice(0, 10).map((p) => (
                    <tr key={p.pincode} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                        {p.pincode}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{p.area || '—'}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-foreground">
                        {p.total_leads}
                      </td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">
                        {p.visits_completed}
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-600 font-semibold">
                        {p.won_leads}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{p.conversion_rate}%</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                        ₹{p.won_revenue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: INBOUND SALES PERFORMANCE ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Sales Rep Leaderboard Table */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Inbound Sales Leaderboard & Activity Metrics
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Granular salesperson metrics: leads managed, outreach speed, follow-up SLA, and deal conversion.
                </p>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {salesData?.length ?? 0} Sales Representatives
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-border">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">Salesperson</th>
                    <th className="py-2.5 px-3 text-center">Managed Leads</th>
                    <th className="py-2.5 px-3 text-center">Fresh Awaiting</th>
                    <th className="py-2.5 px-3 text-center">Activities Logged</th>
                    <th className="py-2.5 px-3 text-center">Follow-ups Done / Overdue</th>
                    <th className="py-2.5 px-3 text-center">Avg Time to Contact</th>
                    <th className="py-2.5 px-3 text-center">Won / Lost</th>
                    <th className="py-2.5 px-3 text-center">Win Rate (%)</th>
                    <th className="py-2.5 px-3 text-right">Won Revenue</th>
                    <th className="py-2.5 px-3 text-right">Drilldown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {salesLoading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-1 text-primary" />
                        Loading sales performance...
                      </td>
                    </tr>
                  ) : !salesData || salesData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground">
                        No sales team members found for this organization.
                      </td>
                    </tr>
                  ) : (
                    salesData.map((rep) => (
                      <tr
                        key={rep.user_id}
                        className={`hover:bg-muted/20 ${
                          selectedRep?.user_id === rep.user_id ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-foreground">{rep.user_name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">
                            {rep.email}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-foreground">
                          {rep.total_leads_managed}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold ${
                              rep.fresh_leads_awaiting_contact > 0
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {rep.fresh_leads_awaiting_contact}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {rep.calls_and_activities_count}
                          <span className="text-[10px] text-muted-foreground block">
                            ({rep.calls_count} calls)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-emerald-600 font-semibold">
                            {rep.follow_ups_completed}
                          </span>
                          {' / '}
                          <span
                            className={rep.follow_ups_overdue > 0 ? 'text-rose-600 font-bold' : 'text-muted-foreground'}
                          >
                            {rep.follow_ups_overdue}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                          {rep.avg_time_to_first_contact_hours !== null
                            ? `${rep.avg_time_to_first_contact_hours} hrs`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-emerald-600 font-semibold">{rep.won_leads}</span>
                          {' / '}
                          <span className="text-rose-500">{rep.lost_leads}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">
                          {rep.conversion_rate}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                          ₹{rep.won_revenue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant={selectedRep?.user_id === rep.user_id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedRepId(rep.user_id)}
                            className="h-7 px-2 text-[11px]"
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drilldown Section for Selected Rep */}
          {selectedRep && (
            <div className="p-5 rounded-xl border border-primary/20 bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {selectedRep.user_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Detailed Inspector: {selectedRep.user_name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono">{selectedRep.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                    Won Deals: ₹{selectedRep.won_revenue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                {/* Temperature Breakdown */}
                <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-rose-500" />
                    Temperature Distribution
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                      <span>Hot Priority:</span>
                      <strong>{selectedRep.temperature_distribution.hot} leads</strong>
                    </div>
                    <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                      <span>Warm Active:</span>
                      <strong>{selectedRep.temperature_distribution.warm} leads</strong>
                    </div>
                    <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                      <span>Cold Nurture:</span>
                      <strong>{selectedRep.temperature_distribution.cold} leads</strong>
                    </div>
                  </div>
                </div>

                {/* Pipeline Milestones */}
                <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-purple-500" />
                    Key Milestones
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Qualified Leads:</span>
                      <strong className="text-foreground">{selectedRep.qualified_leads}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Site Visits Arranged:</span>
                      <strong className="text-foreground">{selectedRep.site_visits_arranged}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Quotations Sent:</span>
                      <strong className="text-foreground">{selectedRep.quotations_sent}</strong>
                    </div>
                  </div>
                </div>

                {/* Response Speed & Health */}
                <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-500" />
                    Outreach Speed
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Avg Time to Contact:</span>
                      <strong className="font-mono text-foreground">
                        {selectedRep.avg_time_to_first_contact_hours !== null
                          ? `${selectedRep.avg_time_to_first_contact_hours} hrs`
                          : 'None logged'}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-rose-600">
                      <span>Inactive Leads (&gt;7d):</span>
                      <strong>{selectedRep.inactive_leads_count} stagnant</strong>
                    </div>
                  </div>
                </div>

                {/* Ageing Breakdown */}
                <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
                  <p className="font-semibold text-foreground">Lead Ageing Buckets</p>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="p-1 rounded bg-background border border-border text-center">
                      <p className="text-muted-foreground">0-3 Days</p>
                      <p className="font-bold">{selectedRep.lead_ageing.days_0_3}</p>
                    </div>
                    <div className="p-1 rounded bg-background border border-border text-center">
                      <p className="text-muted-foreground">4-7 Days</p>
                      <p className="font-bold">{selectedRep.lead_ageing.days_4_7}</p>
                    </div>
                    <div className="p-1 rounded bg-background border border-border text-center">
                      <p className="text-muted-foreground">8-14 Days</p>
                      <p className="font-bold">{selectedRep.lead_ageing.days_8_14}</p>
                    </div>
                    <div className="p-1 rounded bg-background border border-border text-center">
                      <p className="text-muted-foreground">14+ Days</p>
                      <p className="font-bold text-rose-500">{selectedRep.lead_ageing.days_14_plus}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: FIELD AGENT ANALYTICS ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'field' && (
        <div className="space-y-6">
          {/* Field Agent Leaderboard Table */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Field Agent Feasibility & Site Inspection Analytics
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inspection completion rates, report submissions, active workloads, and post-visit win outcomes.
                </p>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {agentData?.length ?? 0} Field Agents
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-border">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">Field Agent</th>
                    <th className="py-2.5 px-3">Service Pincodes</th>
                    <th className="py-2.5 px-3 text-center">Assigned Leads</th>
                    <th className="py-2.5 px-3 text-center">Visits Scheduled</th>
                    <th className="py-2.5 px-3 text-center">Visits Completed</th>
                    <th className="py-2.5 px-3 text-center">Completion Rate</th>
                    <th className="py-2.5 px-3 text-center">Reports Submitted</th>
                    <th className="py-2.5 px-3 text-center">Active Workload</th>
                    <th className="py-2.5 px-3 text-center">Overdue Tasks</th>
                    <th className="py-2.5 px-3 text-right">Drilldown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {agentLoading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-1 text-primary" />
                        Loading field agent data...
                      </td>
                    </tr>
                  ) : !agentData || agentData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground">
                        No field agents registered.
                      </td>
                    </tr>
                  ) : (
                    agentData.map((agent) => (
                      <tr
                        key={agent.user_id}
                        className={`hover:bg-muted/20 ${
                          selectedAgent?.user_id === agent.user_id ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-foreground">{agent.user_name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">
                            {agent.email}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                          {agent.service_pincodes?.slice(0, 3).join(', ') || 'All territory'}
                          {(agent.service_pincodes?.length || 0) > 3
                            ? ` +${agent.service_pincodes.length - 3}`
                            : ''}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-foreground">
                          {agent.assigned_leads}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {agent.site_visits_scheduled}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-600 font-semibold">
                          {agent.site_visits_completed}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">
                          {agent.visit_completion_rate}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {agent.site_reports_submitted}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                            {agent.current_active_workload} active
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          <span
                            className={agent.overdue_tasks > 0 ? 'text-rose-600' : 'text-muted-foreground'}
                          >
                            {agent.overdue_tasks}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant={selectedAgent?.user_id === agent.user_id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedAgentId(agent.user_id)}
                            className="h-7 px-2 text-[11px]"
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Inspector for Selected Agent */}
          {selectedAgent && (
            <div className="p-5 rounded-xl border border-primary/20 bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                    {selectedAgent.user_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Field Inspector: {selectedAgent.user_name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Service Areas: {selectedAgent.service_pincodes?.join(', ') || 'Global'}
                    </p>
                  </div>
                </div>

                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-semibold">
                  Visit Completion Rate: {selectedAgent.visit_completion_rate}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Post Visit Outcomes */}
                <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-emerald-500" />
                    Lead Outcomes After Feasibility Visit
                  </p>
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex justify-between items-center text-emerald-600">
                      <span>Deals Won:</span>
                      <strong>{selectedAgent.outcomes_after_visits.won} deals</strong>
                    </div>
                    <div className="flex justify-between items-center text-purple-600">
                      <span>Quotations Sent:</span>
                      <strong>{selectedAgent.outcomes_after_visits.quotation_sent} quotes</strong>
                    </div>
                    <div className="flex justify-between items-center text-blue-600">
                      <span>In Progress:</span>
                      <strong>{selectedAgent.outcomes_after_visits.in_progress}</strong>
                    </div>
                    <div className="flex justify-between items-center text-rose-600">
                      <span>Disqualified / Lost:</span>
                      <strong>
                        {selectedAgent.outcomes_after_visits.lost +
                          selectedAgent.outcomes_after_visits.disqualified}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Operations & Pending Action */}
                <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    Field Action Status
                  </p>
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Awaiting Site Visit:</span>
                      <strong className="text-amber-600">
                        {selectedAgent.leads_awaiting_field_action} leads
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Reports Submitted:</span>
                      <strong className="text-foreground">
                        {selectedAgent.site_reports_submitted} / {selectedAgent.site_visits_completed}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Follow-up Tasks:</span>
                      <strong className="text-foreground">{selectedAgent.follow_up_actions}</strong>
                    </div>
                  </div>
                </div>

                {/* Overdue Alert */}
                <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                    Workload & Escalation Guard
                  </p>
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Current Active Leads:</span>
                      <strong>{selectedAgent.current_active_workload}</strong>
                    </div>
                    <div className="flex justify-between items-center text-rose-600 font-semibold">
                      <span>Overdue Tasks:</span>
                      <strong>{selectedAgent.overdue_tasks} overdue</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 4: EXPORT CENTER & CRM CONTROLS ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'exports' && (
        <div className="space-y-8">
          {/* CSV Exporter Box */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                Permitted CSV Report Generator
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate RFC 4180 compliant CSV exports with formula injection protection and tamper-resistant audit logging.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Report Dataset
                </label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as any)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background text-foreground"
                >
                  <option value="leads">Leads Master Dataset</option>
                  <option value="sales_performance">Sales Rep Performance Report</option>
                  <option value="agent_performance">Field Agent Feasibility Report</option>
                  <option value="quotations">Solar Quotations & Pricing</option>
                  <option value="audit_logs">Tamper-Proof Audit Logs</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Time Period Scope
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background text-foreground"
                >
                  <option value="30d">Last 30 Days</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="month">Current Month</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="ytd">Year to Date (YTD)</option>
                  <option value="all">Full History</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="default"
                  onClick={handleExport}
                  disabled={exportMutation.isPending}
                  className="w-full h-9 text-xs gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  {exportMutation.isPending ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {exportMutation.isPending ? 'Generating CSV...' : 'Download Permitted CSV'}
                </Button>
              </div>
            </div>

            {exportSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{exportSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* CRM Controls Tab Embedded */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Administrative CRM Controls & Configuration
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize pipeline statuses, customer inquiry classifications, campaign channels, and dispatch rules.
              </p>
            </div>

            <CrmControlsTab />
          </div>
        </div>
      )}
    </div>
  );
}
