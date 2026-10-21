import { Sun } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <span className="absolute inline-flex h-24 w-24 rounded-full bg-primary/20 animate-ping" />
        {/* Icon */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
          <Sun className="h-8 w-8 text-primary animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      </div>
      <p className="mt-6 text-sm text-muted-foreground animate-pulse">Loading Solar CRM…</p>
    </div>
  );
}
