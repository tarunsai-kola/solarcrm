import { Flame, Snowflake, Sun } from 'lucide-react';

interface LeadTemperatureBadgeProps {
  temperature: string;
  className?: string;
  showIcon?: boolean;
}

export function LeadTemperatureBadge({
  temperature,
  className = '',
  showIcon = true,
}: LeadTemperatureBadgeProps) {
  switch (temperature) {
    case 'hot':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 ${className}`}
        >
          {showIcon && <Flame className="h-3 w-3 fill-rose-500 text-rose-500" />}
          Hot
        </span>
      );
    case 'warm':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 ${className}`}
        >
          {showIcon && <Sun className="h-3 w-3 text-amber-500" />}
          Warm
        </span>
      );
    case 'cold':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400 ${className}`}
        >
          {showIcon && <Snowflake className="h-3 w-3 text-sky-500" />}
          Cold
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground ${className}`}
        >
          Unclassified
        </span>
      );
  }
}
