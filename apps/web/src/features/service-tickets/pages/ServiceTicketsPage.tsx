import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
  Plus,
  Search,
  Filter,
  Eye,
  LayoutGrid,
  List,
  ShieldCheck,
  Cpu,
  Wifi,
  Sparkles,
  Phone,
  Calendar,
  Layers,
  Thermometer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  getLocalServiceTickets,
  updateServiceTicket,
  ServiceTicket,
  TicketStatus,
  TicketType,
  TicketPriority,
} from '../services/service-tickets-service';
import { CreateServiceTicketModal } from '../components/CreateServiceTicketModal';
import { TicketDetailDrawer } from '../components/TicketDetailDrawer';

export function ServiceTicketsPage() {
  const navigate = useNavigate();

  // State
  const [tickets, setTickets] = useState<ServiceTicket[]>(() => getLocalServiceTickets());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | TicketType>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [activeTicket, setActiveTicket] = useState<ServiceTicket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.address.toLowerCase().includes(search.toLowerCase()) ||
        t.inverter_telemetry.brand.toLowerCase().includes(search.toLowerCase()) ||
        t.inverter_telemetry.model.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesType = typeFilter === 'all' || t.ticket_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [tickets, search, statusFilter, typeFilter]);

  // KPI Metrics
  const totalCount = tickets.length;
  const faultCount = tickets.filter((t) => t.inverter_telemetry.status === 'fault').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

  const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus, notes?: string | undefined) => {
    const updated = updateServiceTicket(ticketId, {
      status: newStatus,
      resolution_notes: notes || undefined,
    });
    if (updated) {
      setTickets(getLocalServiceTickets());
      setActiveTicket(updated);
    }
  };

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'low':
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/30';
    }
  };

  const getInverterStatusDot = (st: string) => {
    switch (st) {
      case 'normal':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'fault':
        return 'bg-rose-500 animate-pulse';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header & CTAs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <Activity className="h-4 w-4" />
            Operations, AMC & Inverter Telemetry
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            Solar AMC & Service Tickets Desk
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time inverter telemetry tracking, automated breakdown dispatches, preventive AMC maintenance schedules, and SLA management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Raise Service Ticket</span>
          </Button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Tickets</p>
              <h3 className="text-2xl font-bold text-foreground font-mono mt-0.5">{totalCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Wrench className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Inverters In Alarm</p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                {faultCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Dispatches</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                {inProgressCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Resolved / Verified</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {resolvedCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Telemetry Status Ribbon */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Wifi className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">
              Connected Inverter Fleet Telemetry
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Tracking Sungrow, Growatt, Havells, and Deye string inverters across residential and commercial sites.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>3 Generating</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-500">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>1 Warning</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-500">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span>2 Tripped (Action Required)</span>
          </span>
        </div>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ticket #, customer, inverter brand, issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({tickets.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('open')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'open'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'in_progress'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('resolved')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'resolved'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Resolved
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md ${
                viewMode === 'cards' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Cards vs Table */}
      {filteredTickets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Wrench className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Service Tickets Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No tickets match your filters. Raise a new service ticket or reset your search query.
          </p>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            Raise Service Ticket
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="border-border shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-muted text-muted-foreground">
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary block mt-1.5">
                      {ticket.ticket_number}
                    </span>
                    <h3 className="text-sm font-bold text-foreground mt-0.5 group-hover:text-primary transition-colors line-clamp-1">
                      {ticket.title}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-foreground block">
                      {ticket.system_capacity_kw} kWp
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      AMC Active
                    </span>
                  </div>
                </div>

                {/* Customer & Location */}
                <div className="text-xs text-muted-foreground space-y-1 border-t border-border/60 pt-2.5">
                  <div className="text-foreground font-semibold flex items-center justify-between">
                    <span>{ticket.customer_name}</span>
                    <span className="text-[11px] font-mono text-muted-foreground font-normal">{ticket.phone}</span>
                  </div>
                  <div className="truncate text-[11px]">{ticket.address}, {ticket.city}</div>
                </div>

                {/* Inverter Snapshot Box */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-primary" />
                      <span>{ticket.inverter_telemetry.brand} {ticket.inverter_telemetry.model}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium capitalize">
                      <span className={`h-2 w-2 rounded-full ${getInverterStatusDot(ticket.inverter_telemetry.status)}`} />
                      <span>{ticket.inverter_telemetry.status}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/40">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Power Output</span>
                      <strong className="text-foreground font-mono">
                        {ticket.inverter_telemetry.active_power_kw.toFixed(2)} kW
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Today's Yield</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {ticket.inverter_telemetry.daily_yield_kwh.toFixed(1)} kWh
                      </strong>
                    </div>
                  </div>

                  {ticket.inverter_telemetry.active_fault_code && (
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 truncate">
                      Alarm: {ticket.inverter_telemetry.active_fault_code} - {ticket.inverter_telemetry.active_fault_message}
                    </div>
                  )}
                </div>

                {/* Technician & Date */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Tech: <strong className="text-foreground">{ticket.assigned_technician_name?.split(' ')[0] || 'Unassigned'}</strong></span>
                  <span>
                    {ticket.scheduled_visit_date
                      ? new Date(ticket.scheduled_visit_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })
                      : 'Unscheduled'}
                  </span>
                </div>
              </CardContent>

              {/* Footer */}
              <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between">
                <Button
                  size="sm"
                  onClick={() => setActiveTicket(ticket)}
                  className="w-full text-xs h-8 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View & Diagnose
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3.5">Ticket #</th>
                  <th className="p-3.5">Customer & Site</th>
                  <th className="p-3.5">Inverter & Status</th>
                  <th className="p-3.5">Issue Description</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Technician</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-primary">{ticket.ticket_number}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{ticket.customer_name}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">{ticket.city}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-foreground">{ticket.inverter_telemetry.brand}</div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className={`h-2 w-2 rounded-full ${getInverterStatusDot(ticket.inverter_telemetry.status)}`} />
                        <span className="capitalize">{ticket.inverter_telemetry.status}</span>
                      </div>
                    </td>
                    <td className="p-3.5 max-w-[220px]">
                      <div className="font-semibold text-foreground truncate">{ticket.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{ticket.description}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground">{ticket.assigned_technician_name || 'Unassigned'}</td>
                    <td className="p-3.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-muted text-muted-foreground">
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTicket(ticket)}
                        className="text-xs h-7 px-2"
                      >
                        Diagnose
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateServiceTicketModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newTicket) => {
            setTickets(getLocalServiceTickets());
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Ticket Detail Drawer */}
      {activeTicket && (
        <TicketDetailDrawer
          ticket={activeTicket}
          isOpen={Boolean(activeTicket)}
          onClose={() => setActiveTicket(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
