import React, { useState } from 'react';
import { Sun, Compass, Sparkles, ShieldCheck, Layers } from 'lucide-react';
import { RoofType } from '../utils/rooftop-sizer-calc';

interface RooftopVisualCanvasProps {
  rooftopAreaSqFt: number;
  usableAreaSqFt: number;
  roofType: RoofType;
  recommendedPanelsCount: number;
  maxFeasiblePanelsCount: number;
  moduleWattageWp: number;
  recommendedCapacityKw: number;
}

export function RooftopVisualCanvas({
  rooftopAreaSqFt,
  usableAreaSqFt,
  roofType,
  recommendedPanelsCount,
  maxFeasiblePanelsCount,
  moduleWattageWp,
  recommendedCapacityKw,
}: RooftopVisualCanvasProps) {
  const [viewMode, setViewMode] = useState<'recommended' | 'maximum'>('recommended');
  const [hoveredPanel, setHoveredPanel] = useState<number | null>(null);

  // Active panel count based on view mode
  const activePanelsCount =
    viewMode === 'recommended' ? recommendedPanelsCount : maxFeasiblePanelsCount;

  // Grid layout calculation (columns x rows)
  // Standard solar array aspect ratio is roughly 2:1 or 3:2
  const cols = Math.max(2, Math.min(8, Math.ceil(Math.sqrt(activePanelsCount * 1.6))));
  const rows = Math.ceil(activePanelsCount / cols);

  // Styling based on roof type
  const getRoofBackground = () => {
    switch (roofType) {
      case 'metal_shed':
        return 'bg-gradient-to-br from-slate-800 via-blue-950 to-slate-900 border-blue-500/30';
      case 'tiled_sloped':
        return 'bg-gradient-to-br from-amber-950/60 via-red-950/40 to-slate-900 border-amber-600/30';
      case 'flat_rcc':
      default:
        return 'bg-gradient-to-br from-zinc-900 via-stone-900 to-zinc-950 border-zinc-700/50';
    }
  };

  const getRoofTexturePattern = () => {
    if (roofType === 'metal_shed') {
      return (
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="metal-lines" width="20" height="20" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="20" stroke="#38bdf8" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#metal-lines)" />
        </svg>
      );
    }
    if (roofType === 'tiled_sloped') {
      return (
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="tile-pattern" width="24" height="14" patternUnits="userSpaceOnUse">
              <path d="M 0 14 Q 12 0 24 14" fill="none" stroke="#f97316" strokeWidth="1.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tile-pattern)" />
        </svg>
      );
    }
    // Flat RCC grid
    return (
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="rcc-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#a1a1aa" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#rcc-grid)" />
      </svg>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Virtual Rooftop Solar Array Simulator
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                True Aspect 2D Model
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Simulating {activePanelsCount} Tier-1 {moduleWattageWp}Wp panels ({((activePanelsCount * moduleWattageWp) / 1000).toFixed(1)} kWp)
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('recommended')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              viewMode === 'recommended'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Recommended ({recommendedPanelsCount} Panels)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('maximum')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              viewMode === 'maximum'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Max Roof Fit ({maxFeasiblePanelsCount} Panels)
          </button>
        </div>
      </div>

      {/* Main Rooftop Canvas Area */}
      <div
        className={`relative overflow-hidden rounded-xl border p-6 min-h-[340px] flex flex-col justify-between transition-colors duration-300 ${getRoofBackground()}`}
      >
        {/* Roof Texture Pattern */}
        {getRoofTexturePattern()}

        {/* Top Info Bar on Canvas */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10">
            <Compass className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-mono">South Azimuth 180° | 12° Optimal Tilt</span>
          </div>

          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10">
            <Sun className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span>Peak Solar Irradiance: 5.2 kWh/m²/day</span>
          </div>
        </div>

        {/* Solar Panels Grid Display */}
        <div className="relative z-10 my-4 flex items-center justify-center">
          <div className="p-4 rounded-xl bg-black/40 backdrop-blur-xs border border-white/10 shadow-2xl">
            <div
              className="grid gap-2 max-w-full"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: activePanelsCount }).map((_, idx) => {
                const isHovered = hoveredPanel === idx;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredPanel(idx)}
                    onMouseLeave={() => setHoveredPanel(null)}
                    className={`relative w-12 sm:w-16 h-18 sm:h-22 rounded-sm border transition-all duration-200 cursor-pointer flex flex-col justify-between p-1 shadow-md group ${
                      isHovered
                        ? 'border-amber-400 scale-105 z-20 shadow-amber-500/20 shadow-lg'
                        : 'border-cyan-400/50 hover:border-cyan-300'
                    } bg-gradient-to-b from-blue-900 via-sky-950 to-slate-900`}
                  >
                    {/* Solar cell busbar lines */}
                    <div className="absolute inset-0 flex flex-col justify-between p-0.5 opacity-40 pointer-events-none">
                      <div className="border-b border-cyan-300/40 w-full h-[25%]" />
                      <div className="border-b border-cyan-300/40 w-full h-[25%]" />
                      <div className="border-b border-cyan-300/40 w-full h-[25%]" />
                    </div>
                    <div className="absolute inset-0 flex justify-between p-0.5 opacity-40 pointer-events-none">
                      <div className="border-r border-cyan-300/40 h-full w-[33%]" />
                      <div className="border-r border-cyan-300/40 h-full w-[33%]" />
                    </div>

                    {/* Module index indicator */}
                    <div className="relative z-10 flex items-center justify-between text-[8px] font-mono text-cyan-200 font-semibold px-0.5">
                      <span>P{idx + 1}</span>
                      <Sparkles className="h-2 w-2 text-cyan-300 group-hover:text-amber-400" />
                    </div>

                    {/* Spec badge */}
                    <div className="relative z-10 text-[7px] font-mono text-center text-slate-300/90 group-hover:text-amber-300 bg-black/50 rounded-xs py-0.5 px-0.5 truncate">
                      {moduleWattageWp}W
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hover Tooltip display */}
            {hoveredPanel !== null && (
              <div className="mt-3 text-center text-xs font-mono text-amber-300 bg-black/70 py-1 px-3 rounded-md border border-amber-400/30">
                Module #{hoveredPanel + 1}: Tier-1 {moduleWattageWp}Wp High-Efficiency Bifacial Dual-Glass | String {Math.floor(hoveredPanel / 10) + 1}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Terrace Boundary Spec Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Rooftop Footprint:</span>
            <span>{rooftopAreaSqFt.toLocaleString()} sq ft Total</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-medium">
              {usableAreaSqFt.toLocaleString()} sq ft Shadow-Free Usable
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-300">
              Array Utilizes {Math.round((activePanelsCount * 32 * 100) / usableAreaSqFt)}% of Usable Space
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
