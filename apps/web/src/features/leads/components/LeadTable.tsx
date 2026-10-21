import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  Clock,
  ExternalLink,
  MessageSquare,
  MoreVertical,
  Phone,
  UserCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import type { LeadWithRelations } from '../hooks/use-leads';
import { LeadStatusBadge } from './LeadStatusBadge';
import { LeadTemperatureBadge } from './LeadTemperatureBadge';

interface LeadTableProps {
  leads: LeadWithRelations[];
  isLoading: boolean;
  isError: boolean;
  selectedLeadIds: string[];
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: string) => void;
  onSelectLead: (id: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: string) => void;
}

export function LeadTable({
  leads,
  isLoading,
  isError,
  selectedLeadIds,
  onToggleSelectAll,
  onToggleSelectRow,
  onSelectLead,
  sortBy,
  sortOrder,
  onSortChange,
}: LeadTableProps) {
  const isAllSelected = leads.length > 0 && selectedLeadIds.length === leads.length;

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Leads table">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs">
              {/* Checkbox column */}
              <th scope="col" className="px-4 py-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  id="select-all-leads-checkbox"
                  aria-label="Select all leads on current page"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded-sm border-input text-primary focus:ring-primary cursor-pointer"
                />
              </th>

              {/* Customer Name */}
              <th
                scope="col"
                onClick={() => onSortChange('customer_name')}
                className="px-4 py-3.5 text-left font-semibold text-muted-foreground cursor-pointer group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Customer Name</span>
                  {renderSortIcon('customer_name')}
                </div>
              </th>

              {/* Contact & Location */}
              <th scope="col" className="px-4 py-3.5 text-left font-semibold text-muted-foreground">
                Location & Pincode
              </th>

              {/* Status */}
              <th
                scope="col"
                onClick={() => onSortChange('status')}
                className="px-4 py-3.5 text-left font-semibold text-muted-foreground cursor-pointer group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              {/* Temperature */}
              <th
                scope="col"
                onClick={() => onSortChange('temperature')}
                className="px-4 py-3.5 text-left font-semibold text-muted-foreground cursor-pointer group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Temp</span>
                  {renderSortIcon('temperature')}
                </div>
              </th>

              {/* Team Assignment */}
              <th scope="col" className="px-4 py-3.5 text-left font-semibold text-muted-foreground">
                Assigned Team
              </th>

              {/* Next Follow-up */}
              <th
                scope="col"
                onClick={() => onSortChange('next_follow_up_at')}
                className="px-4 py-3.5 text-left font-semibold text-muted-foreground cursor-pointer group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Next Follow-up</span>
                  {renderSortIcon('next_follow_up_at')}
                </div>
              </th>

              {/* Created At */}
              <th
                scope="col"
                onClick={() => onSortChange('created_at')}
                className="px-4 py-3.5 text-left font-semibold text-muted-foreground cursor-pointer group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Created</span>
                  {renderSortIcon('created_at')}
                </div>
              </th>

              {/* Actions */}
              <th scope="col" className="px-4 py-3.5 text-right font-semibold text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {isLoading && <TableSkeleton rows={10} cols={9} />}

            {isError && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">
                  Failed to fetch lead records. Check your database or API connectivity.
                </td>
              </tr>
            )}

            {!isLoading && !isError && leads.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                      <Clock className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-foreground">No leads match your criteria</p>
                    <p className="text-xs text-muted-foreground">
                      Try clearing search queries or switching filters to view other stages in the pipeline.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              leads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                const hasOverdue = lead.is_overdue;

                // WhatsApp URL
                const cleanPhone = lead.phone.replace(/\D/g, '');
                const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone.slice(-10)}`;
                const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
                  `Hello ${lead.customer_name}, Sunbeam Solar consulting team here regarding your enquiry.`,
                )}`;

                return (
                  <tr
                    key={lead.id}
                    className={`transition-colors hover:bg-muted/40 cursor-pointer ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => onSelectLead(lead.id)}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-4 py-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectRow(lead.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectRow(lead.id)}
                        aria-label={`Select lead ${lead.customer_name}`}
                        className="h-4 w-4 rounded-sm border-input text-primary focus:ring-primary cursor-pointer"
                      />
                    </td>

                    {/* Customer Name & Phone */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground hover:text-primary transition-colors">
                        {lead.customer_name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </div>
                    </td>

                    {/* Location & Pincode */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div className="font-medium text-foreground">{lead.area || '—'}</div>
                      <div className="text-[11px]">{lead.pincode ? `PIN: ${lead.pincode}` : 'No pincode'}</div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={lead.status} />
                    </td>

                    {/* Temperature */}
                    <td className="px-4 py-3">
                      <LeadTemperatureBadge temperature={lead.temperature} />
                    </td>

                    {/* Assigned Team */}
                    <td className="px-4 py-3 text-xs">
                      {lead.inbound_sales?.full_name ? (
                        <div className="text-foreground font-medium truncate max-w-[140px]">
                          Sales: {lead.inbound_sales.full_name}
                        </div>
                      ) : (
                        <div className="text-muted-foreground italic text-[11px]">Unassigned Sales</div>
                      )}
                      {lead.assigned_field_agent?.full_name ? (
                        <div className="text-muted-foreground text-[11px] truncate max-w-[140px]">
                          Agent: {lead.assigned_field_agent.full_name}
                        </div>
                      ) : null}
                    </td>

                    {/* Next Follow-up */}
                    <td className="px-4 py-3 text-xs">
                      {lead.next_follow_up_at ? (
                        <div className="flex items-center gap-1.5">
                          {hasOverdue && (
                            <span className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full text-[10px]">
                              <AlertTriangle className="h-3 w-3" />
                              OVERDUE
                            </span>
                          )}
                          <span className={hasOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-foreground'}>
                            {new Date(lead.next_follow_up_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs">—</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Quick Row Actions */}
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp Chat"
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </a>
                        <a
                          href={`tel:${lead.phone}`}
                          title={`Call ${lead.phone}`}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => onSelectLead(lead.id)}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
