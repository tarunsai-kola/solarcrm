import React, { useState } from 'react';
import {
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  Gauge,
  RefreshCw,
  Cpu,
  Wifi,
  Sparkles,
  Layers,
} from 'lucide-react';
import { InverterTelemetry } from '../services/service-tickets-service';
import { Button } from '@/components/ui/button';

interface InverterTelemetryWidgetProps {
  telemetry: InverterTelemetry;
  customerName?: string | undefined;
}

export function InverterTelemetryWidget({ telemetry, customerName }: InverterTelemetryWidgetProps) {
  const [data, setData] = useState<InverterTelemetry>(telemetry);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePingTelemetry = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate live jitter
      setData((prev) => ({
        ...prev,
        grid_voltage_v: Number((prev.grid_voltage_v + (Math.random() * 2 - 1)).toFixed(1)),
        grid_frequency_hz: Number((prev.grid_frequency_hz + (Math.random() * 0.04 - 0.02)).toFixed(2)),
        internal_temp_c: Number((prev.internal_temp_c + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        active_power_kw:
          prev.status === 'fault'
            ? 0.0
            : Number((prev.active_power_kw + (Math.random() * 0.1 - 0.05)).toFixed(2)),
        last_telemetry_time: new Date().toISOString(),
      }));
      setIsRefreshing(false);
    }, 600);
  };

  const getStatusBadge = () => {
    switch (data.status) {
      case 'normal':
        return {
          label: 'Generating (Online)',
          dot: 'bg-emerald-500 animate-pulse',
          badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'warning':
        return {
          label: 'Derating / Warning',
          dot: 'bg-amber-500 animate-pulse',
          badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'fault':
        return {
          label: 'Fault Alarm / Tripped',
          dot: 'bg-rose-500 animate-ping',
          badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        };
      case 'offline':
      default:
        return {
          label: 'Offline (No Grid)',
          dot: 'bg-slate-400',
          badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <div className="bg-gradient-to-br from-card via-card to-muted/40 border border-border rounded-xl p-5 shadow-sm space-y-4">
      {/* Inverter Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">
                {data.brand} {data.model}
              </h4>
              <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border">
                {data.serial_number}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Wifi className="h-3 w-3 text-emerald-500" />
              <span>4G IoT Inverter Gateway</span>
              <span>•</span>
              <span>{data.system_capacity_kw} kW System</span>
              {customerName && (
                <>
                  <span>•</span>
                  <span className="text-foreground font-medium">{customerName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${statusInfo.badge}`}>
            <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
            <span>{statusInfo.label}</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePingTelemetry}
            disabled={isRefreshing}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Ping Inverter Diagnostics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Fault Alert Banner if Active */}
      {data.status === 'fault' && data.active_fault_code && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold">
              Active Inverter Fault Alarm: Error {data.active_fault_code}
            </div>
            <div className="text-[11px] opacity-90">{data.active_fault_message}</div>
          </div>
        </div>
      )}

      {/* Warning Banner if Derating */}
      {data.status === 'warning' && data.active_fault_code && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold">Notice: {data.active_fault_code}</div>
            <div className="text-[11px] opacity-90">{data.active_fault_message}</div>
          </div>
        </div>
      )}

      {/* Live Electrical & Energy Performance Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-card border border-border shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-500" /> Active Power
          </span>
          <div className="text-xl font-extrabold text-foreground font-mono mt-1">
            {data.active_power_kw.toFixed(2)}{' '}
            <span className="text-xs font-normal text-muted-foreground">kW</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {((data.active_power_kw / data.system_capacity_kw) * 100).toFixed(0)}% Rated Output
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Gauge className="h-3 w-3 text-emerald-500" /> Today's Yield
          </span>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {data.daily_yield_kwh.toFixed(1)}{' '}
            <span className="text-xs font-normal text-muted-foreground">kWh</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Lifetime: {data.total_yield_mwh.toFixed(2)} MWh
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3 text-primary" /> Grid AC Voltage
          </span>
          <div
            className={`text-xl font-extrabold font-mono mt-1 ${
              data.grid_voltage_v > 260 || data.grid_voltage_v < 195
                ? 'text-rose-500'
                : 'text-foreground'
            }`}
          >
            {data.grid_voltage_v.toFixed(1)}{' '}
            <span className="text-xs font-normal text-muted-foreground">V</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Freq: {data.grid_frequency_hz.toFixed(2)} Hz
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Thermometer className="h-3 w-3 text-rose-500" /> Inverter Temp
          </span>
          <div className="text-xl font-extrabold text-foreground font-mono mt-1">
            {data.internal_temp_c.toFixed(1)}{' '}
            <span className="text-xs font-normal text-muted-foreground">°C</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Heatsink Core</div>
        </div>
      </div>
    </div>
  );
}
