import { LEAD_STATUS_CONFIG, type LeadStatus } from '@solar-crm/shared';

interface LeadStatusBadgeProps {
  status: string;
  className?: string;
}

export function LeadStatusBadge({ status, className = '' }: LeadStatusBadgeProps) {
  const config =
    LEAD_STATUS_CONFIG[status as LeadStatus] ?? {
      label: status.replace(/_/g, ' '),
      badge: 'bg-muted text-muted-foreground border-border',
      dotColor: 'bg-muted-foreground',
      description: status,
    };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize transition-colors ${config.badge} ${className}`}
      title={config.description}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}
