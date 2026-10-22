import React from 'react';
import {
  X,
  MapPin,
  Compass,
  Calendar,
  Building2,
  Zap,
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Sparkles,
  Phone,
  Mail,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteVisit } from '../services/site-visits-service';

interface SiteVisitDetailDrawerProps {
  visit: SiteVisit | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (visit: SiteVisit) => void;
  onConvertToQuote: (visit: SiteVisit) => void;
}

export function SiteVisitDetailDrawer({
  visit,
  isOpen,
  onClose,
  onEdit,
  onConvertToQuote,
}: SiteVisitDetailDrawerProps) {
  if (!isOpen || !visit) return null;

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `📋 *KOLA SOLAR — TECHNICAL SITE AUDIT REPORT*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Customer:* ${visit.customer_name}\n` +
      `📍 *Location:* ${visit.address}, ${visit.city}\n` +
      `⚡ *DISCOM:* ${visit.discom_name} (CA: ${visit.consumer_number})\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏢 *ROOFTOP & STRUCTURAL FEASIBILITY:*\n` +
      `• Roof Type: ${visit.roof_type.replace('_', ' ').toUpperCase()}\n` +
      `• Measured Shadow-Free Area: ${visit.shadow_free_area_sqft} sq ft\n` +
      `• Optimal Tilt: ${visit.optimal_tilt_angle_deg}° South (Azimuth: ${visit.azimuth_degrees}°)\n` +
      `• Sanctioned Load: ${visit.sanctioned_load_kw} kW (${visit.connection_phase.replace('_', ' ')})\n` +
      `• Feasibility Verdict: *${visit.roof_suitability.replace(/_/g, ' ').toUpperCase()}*\n` +
      `• Recommended Capacity: *${visit.recommended_system_capacity_kw} kWp* (${visit.recommended_panels_count} Panels)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Surveyed by certified solar engineer: ${visit.field_agent_name}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-card border-l border-border h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Top Header */}
        <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  visit.visit_status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {visit.visit_status.replace('_', ' ')}
              </span>
              <span className="text-xs font-mono text-muted-foreground">{visit.id}</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mt-1">{visit.customer_name}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {visit.address}, {visit.city} — {visit.pincode}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Verdict Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              visit.roof_suitability === 'highly_suitable'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : visit.roof_suitability === 'suitable_with_conditions'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
            }`}
          >
            <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-sm font-bold">
                {visit.roof_suitability === 'highly_suitable'
                  ? 'Site Feasibility: Approved (Highly Suitable)'
                  : visit.roof_suitability === 'suitable_with_conditions'
                  ? 'Site Feasibility: Suitable with Mitigations'
                  : 'Site Feasibility: Not Suitable / High Risk'}
              </div>
              <div className="text-xs opacity-90">{visit.site_observations}</div>
            </div>
          </div>

          {/* Sizing & Capacity Summary Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-primary block">Recommended Sizing</span>
              <span className="text-2xl font-extrabold text-foreground font-mono">
                {visit.recommended_system_capacity_kw} kWp
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Module Count</span>
              <span className="text-2xl font-extrabold text-foreground font-mono">
                {visit.recommended_panels_count}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Shadow-Free Area</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {visit.shadow_free_area_sqft} sq ft
              </span>
            </div>
          </div>

          {/* GPS Coordinates & Map Link */}
          {visit.gps_coordinates && (
            <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Verified Geotagged Pin</div>
                  <div className="text-[11px] font-mono text-muted-foreground">
                    Lat: {visit.gps_coordinates.latitude}° N, Long: {visit.gps_coordinates.longitude}° E (±{visit.gps_coordinates.accuracy_m}m)
                  </div>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${visit.gps_coordinates.latitude},${visit.gps_coordinates.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View Map</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Grid of Key Technical Specs */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Technical Audit Parameters
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-muted-foreground">Roof Type:</span>
                <div className="font-semibold text-foreground capitalize">
                  {visit.roof_type.replace('_', ' ')} ({visit.roof_age_years} yrs old)
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-muted-foreground">Structural Integrity:</span>
                <div className="font-semibold text-foreground capitalize">
                  {visit.roof_condition_rating.replace('_', ' ')}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-muted-foreground">Optimal Tilt & Azimuth:</span>
                <div className="font-semibold text-foreground font-mono">
                  {visit.optimal_tilt_angle_deg}° Tilt / {visit.azimuth_degrees}° Azimuth (South)
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-muted-foreground">DISCOM Sanctioned Load:</span>
                <div className="font-semibold text-foreground font-mono">
                  {visit.sanctioned_load_kw} kW ({visit.connection_phase.replace('_', ' ')})
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-muted-foreground">Cabling Distances:</span>
                <div className="font-semibold text-foreground font-mono">
                  DC: {visit.dc_cable_length_m}m | AC: {visit.ac_cable_length_m}m
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-muted-foreground">Earthing & Protection:</span>
                <div className="font-semibold text-foreground">
                  {visit.earthing_pits_required} Chemical Pits • LA Feasible: {visit.lightning_arrester_feasible ? 'Yes' : 'No'}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-1 col-span-2">
                <span className="text-muted-foreground">Inverter Proposed Placement:</span>
                <div className="font-semibold text-foreground">{visit.inverter_location}</div>
              </div>
            </div>
          </div>

          {/* Photo Evidence Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Photo Evidence Checklist ({visit.photos.length} Captured)
              </h4>
            </div>

            {visit.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {visit.photos.map((photo) => (
                  <div key={photo.id} className="rounded-xl border border-border overflow-hidden bg-muted/20">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2.5 space-y-0.5">
                      <div className="text-xs font-semibold text-foreground truncate">{photo.title}</div>
                      {photo.notes && <div className="text-[11px] text-muted-foreground line-clamp-2">{photo.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                No photos attached yet. Open "Edit / Resume Audit" to attach on-site photos.
              </div>
            )}
          </div>

          {/* Signatures & Auditor */}
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Surveying Engineer:</span>
              <span className="font-semibold text-foreground">{visit.field_agent_name} ({visit.field_agent_phone})</span>
            </div>
            {visit.surveyor_signature && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Engineer Sign-Off:</span>
                <span className="font-serif italic font-semibold text-primary">{visit.surveyor_signature}</span>
              </div>
            )}
            {visit.customer_signature && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Customer Acknowledgement:</span>
                <span className="font-serif italic font-semibold text-foreground">{visit.customer_signature}</span>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-4 border-t border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="text-emerald-600 dark:text-emerald-400 hover:border-emerald-500"
            >
              <Share2 className="h-4 w-4 mr-1" />
              <span>WhatsApp</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-1" />
              <span>Print Report</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(visit);
              }}
            >
              Edit Audit
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose();
                onConvertToQuote(visit);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Quotation</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
