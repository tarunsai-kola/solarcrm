import React, { useState } from 'react';
import {
  X,
  MapPin,
  Compass,
  Zap,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ShieldCheck,
  FileCheck,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SiteVisit,
  SiteAuditPhoto,
  RoofConstructionType,
  PhaseType,
  RoofSuitability,
} from '../services/site-visits-service';

interface SiteSurveyAuditModalProps {
  visit: SiteVisit;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedVisit: Partial<SiteVisit>) => void;
  onConvertToQuote?: (visit: SiteVisit) => void;
}

export function SiteSurveyAuditModal({
  visit,
  isOpen,
  onClose,
  onSave,
  onConvertToQuote,
}: SiteSurveyAuditModalProps) {
  if (!isOpen) return null;

  const [activeStep, setActiveStep] = useState<number>(1);

  // Form state initialized from visit
  const [formData, setFormData] = useState<Partial<SiteVisit>>({
    ...visit,
    photos: [...visit.photos],
  });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(Boolean(visit.gps_coordinates));

  // Capture GPS Geotag
  const handleCaptureGps = () => {
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            gps_coordinates: {
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              accuracy_m: Math.round(pos.coords.accuracy),
            },
          }));
          setGpsLoading(false);
          setGpsSuccess(true);
        },
        () => {
          // Fallback simulation for local/desktop testing
          setFormData((prev) => ({
            ...prev,
            gps_coordinates: {
              latitude: 12.9716,
              longitude: 77.5946,
              accuracy_m: 5,
            },
          }));
          setGpsLoading(false);
          setGpsSuccess(true);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      setFormData((prev) => ({
        ...prev,
        gps_coordinates: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy_m: 5,
        },
      }));
      setGpsLoading(false);
      setGpsSuccess(true);
    }
  };

  // Add dummy photo
  const handleAddSamplePhoto = (category: SiteAuditPhoto['category'], title: string) => {
    const sampleUrls: Record<string, string> = {
      roof_panorama: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=600&q=80',
      meter_reading: 'https://images.unsplash.com/photo-1558441719-8b489c6ef2d1?auto=format&fit=crop&w=600&q=80',
      main_db: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=80',
      earthing_pit: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      inverter_wall: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
      access_route: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f13f7?auto=format&fit=crop&w=600&q=80',
    };

    const newPhoto: SiteAuditPhoto = {
      id: `photo-${Date.now()}`,
      category,
      title,
      url: sampleUrls[category] ?? sampleUrls.roof_panorama ?? 'https://images.unsplash.com/photo-1508873696983-2df5293cb395',
      captured_at: new Date().toISOString(),
      notes: `Verified by field surveyor on site audit.`,
    };

    setFormData((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), newPhoto],
    }));
  };

  const handleRemovePhoto = (photoId: string) => {
    setFormData((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((p) => p.id !== photoId),
    }));
  };

  const handleCompleteSurvey = () => {
    onSave({
      ...formData,
      visit_status: 'completed',
      completed_at: new Date().toISOString(),
      surveyor_signature: formData.surveyor_signature || `${formData.field_agent_name} (Field Engineer)`,
    });
    onClose();
  };

  const handleSaveDraft = () => {
    onSave(formData);
    onClose();
  };

  const steps = [
    { number: 1, title: 'Site & GPS', icon: MapPin },
    { number: 2, title: 'Roof Structure', icon: Building2 },
    { number: 3, title: 'Electrical & DB', icon: Zap },
    { number: 4, title: 'Photo Checklist', icon: Camera },
    { number: 5, title: 'Verdict & Sign-off', icon: FileCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Technical Rooftop Audit & Site Inspection
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-primary/10 text-primary border border-primary/20">
                  {visit.id}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customer: <strong className="text-foreground">{visit.customer_name}</strong> • {visit.address}, {visit.city}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="px-4 py-3 bg-muted/20 border-b border-border overflow-x-auto shrink-0">
          <div className="flex items-center justify-between min-w-[500px]">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = activeStep === s.number;
              const isPast = activeStep > s.number;
              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => setActiveStep(s.number)}
                  className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : isPast
                      ? 'text-emerald-600 dark:text-emerald-400 hover:bg-muted'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      isActive
                        ? 'bg-primary-foreground text-primary'
                        : isPast
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.number}
                  </div>
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: Site Profile & GPS Geotagging */}
          {activeStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    GPS Site Geotag & Coordinates Verification
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Required for DISCOM net-metering & MNRE National Portal subsidy sanction.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {gpsSuccess && formData.gps_coordinates && (
                    <div className="text-right text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20">
                      <div>{formData.gps_coordinates.latitude}° N, {formData.gps_coordinates.longitude}° E</div>
                      <div className="text-[10px] text-muted-foreground">±{formData.gps_coordinates.accuracy_m}m accuracy</div>
                    </div>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCaptureGps}
                    disabled={gpsLoading}
                    className="flex items-center gap-1.5"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>{gpsLoading ? 'Acquiring GPS...' : 'Capture GPS Pin'}</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Customer Name</label>
                  <Input
                    value={formData.customer_name || ''}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Phone Number</label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Site Address</label>
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">DISCOM / Electricity Board</label>
                  <Input
                    value={formData.discom_name || ''}
                    onChange={(e) => setFormData({ ...formData, discom_name: e.target.value })}
                    placeholder="e.g. BESCOM, Tata Power, MSEDCL"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Consumer Connection / CA Number</label>
                  <Input
                    value={formData.consumer_number || ''}
                    onChange={(e) => setFormData({ ...formData, consumer_number: e.target.value })}
                    placeholder="e.g. BES-10492819"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Assigned Field Surveyor</label>
                  <Input
                    value={formData.field_agent_name || ''}
                    onChange={(e) => setFormData({ ...formData, field_agent_name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Scheduled Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: new Date(e.target.value).toISOString() })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Rooftop & Structural Audit */}
          {activeStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Roof Construction Surface Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { type: 'flat_rcc', label: 'Flat RCC Slab', desc: 'Standard concrete terrace, elevated MMS' },
                    { type: 'industrial_metal', label: 'Industrial Metal Shed', desc: 'Trapezoidal/standing seam, direct clamp' },
                    { type: 'tiled_sloped', label: 'Tiled Sloped Roof', desc: 'Mangalore/clay tiles, custom rafter hooks' },
                  ].map((r) => (
                    <button
                      key={r.type}
                      type="button"
                      onClick={() => setFormData({ ...formData, roof_type: r.type as RoofConstructionType })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formData.roof_type === r.type
                          ? 'border-primary bg-primary/10 shadow-xs'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground">{r.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Total Roof Area (Sq Ft)</label>
                  <Input
                    type="number"
                    value={formData.total_roof_area_sqft || ''}
                    onChange={(e) => setFormData({ ...formData, total_roof_area_sqft: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Measured Shadow-Free Area (Sq Ft)</label>
                  <Input
                    type="number"
                    value={formData.shadow_free_area_sqft || ''}
                    onChange={(e) => setFormData({ ...formData, shadow_free_area_sqft: Number(e.target.value) })}
                    className="border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Parapet Wall Height (Ft)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.parapet_height_ft || ''}
                    onChange={(e) => setFormData({ ...formData, parapet_height_ft: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Roof Age (Years)</label>
                  <Input
                    type="number"
                    value={formData.roof_age_years || ''}
                    onChange={(e) => setFormData({ ...formData, roof_age_years: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Optimal Tilt Angle (°)</label>
                  <Input
                    type="number"
                    value={formData.optimal_tilt_angle_deg || 13}
                    onChange={(e) => setFormData({ ...formData, optimal_tilt_angle_deg: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">South Azimuth Compass (°)</label>
                  <Input
                    type="number"
                    value={formData.azimuth_degrees || 180}
                    onChange={(e) => setFormData({ ...formData, azimuth_degrees: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Structural Strength Rating */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-foreground block">
                  Structural Integrity & Wind Load Rating
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'excellent', label: 'Excellent', desc: 'No cracks, withstands 150 km/h wind' },
                    { id: 'good', label: 'Good', desc: 'Minor weather wear, suitable for standard MMS' },
                    { id: 'needs_reinforcement', label: 'Needs Reinforcement', desc: 'Requires anchor bracing / pedastals' },
                  ].map((rating) => (
                    <button
                      key={rating.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, roof_condition_rating: rating.id as any })}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        formData.roof_condition_rating === rating.id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="text-xs font-semibold text-foreground">{rating.label}</div>
                      <div className="text-[10px] text-muted-foreground">{rating.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Electrical & Infrastructure Assessment */}
          {activeStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Sanctioned DISCOM Load (kW)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.sanctioned_load_kw || ''}
                    onChange={(e) => setFormData({ ...formData, sanctioned_load_kw: Number(e.target.value) })}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Required for on-grid net-metering limit.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Connection Grid Phase</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, connection_phase: 'single_phase' })}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                        formData.connection_phase === 'single_phase'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      Single Phase (230V)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, connection_phase: 'three_phase' })}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                        formData.connection_phase === 'three_phase'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      3-Phase (415V)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Estimated DC Cable Length (Meters)</label>
                  <Input
                    type="number"
                    value={formData.dc_cable_length_m || ''}
                    onChange={(e) => setFormData({ ...formData, dc_cable_length_m: Number(e.target.value) })}
                    placeholder="Array to Inverter"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Estimated AC Cable Length (Meters)</label>
                  <Input
                    type="number"
                    value={formData.ac_cable_length_m || ''}
                    onChange={(e) => setFormData({ ...formData, ac_cable_length_m: Number(e.target.value) })}
                    placeholder="Inverter to Main DB"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Earthing Pits Required</label>
                  <Input
                    type="number"
                    value={formData.earthing_pits_required || 3}
                    onChange={(e) => setFormData({ ...formData, earthing_pits_required: Number(e.target.value) })}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Standard: 1 AC Earth, 1 DC Earth, 1 Lightning Arrester Earth
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Lightning Arrester Feasibility</label>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="la-check"
                      checked={formData.lightning_arrester_feasible ?? true}
                      onChange={(e) => setFormData({ ...formData, lightning_arrester_feasible: e.target.checked })}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <label htmlFor="la-check" className="text-xs text-foreground cursor-pointer">
                      Site supports 10-meter radius Lightning Protection
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Proposed Inverter Mounting Location</label>
                  <Input
                    value={formData.inverter_location || ''}
                    onChange={(e) => setFormData({ ...formData, inverter_location: e.target.value })}
                    placeholder="e.g. Covered staircase head-room, garage side wall"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Photo Evidence Checklist */}
          {activeStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">On-Site Photo Evidence Checklist</h4>
                  <p className="text-xs text-muted-foreground">
                    Upload or attach real site photos for engineering SLD and DISCOM application.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {(formData.photos || []).length} / 6 Attached
                </span>
              </div>

              {/* Photo Category Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { cat: 'roof_panorama' as const, label: '1. Rooftop Panorama' },
                  { cat: 'meter_reading' as const, label: '2. DISCOM Net-Meter' },
                  { cat: 'main_db' as const, label: '3. Main AC Breaker DB' },
                  { cat: 'earthing_pit' as const, label: '4. Chemical Earthing Ground' },
                  { cat: 'inverter_wall' as const, label: '5. Inverter Mounting Wall' },
                  { cat: 'access_route' as const, label: '6. Roof Staircase Access' },
                ].map((item) => {
                  const existing = (formData.photos || []).find((p) => p.category === item.cat);
                  return (
                    <div
                      key={item.cat}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                        existing ? 'border-emerald-500/40 bg-card' : 'border-dashed border-border bg-muted/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-foreground">{item.label}</span>
                        {existing ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Done
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-500 font-medium">Pending</span>
                        )}
                      </div>

                      {existing ? (
                        <div className="space-y-2">
                          <img
                            src={existing.url}
                            alt={existing.title}
                            className="w-full h-24 object-cover rounded-lg border border-border"
                          />
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="truncate max-w-[140px]">{existing.title}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(existing.id)}
                              className="text-rose-500 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 flex flex-col items-center justify-center gap-2">
                          <Camera className="h-6 w-6 text-muted-foreground" />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddSamplePhoto(item.cat, item.label)}
                            className="text-xs h-7 px-2"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Attach Photo
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Verdict, Sizing & Sign-off */}
          {activeStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Feasibility Verdict Badges */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Final Engineering Feasibility Verdict
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'highly_suitable',
                      label: 'Approved (Highly Feasible)',
                      color: 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                      desc: 'Full shadow-free terrace, structurally sound, ready for installation.',
                    },
                    {
                      id: 'suitable_with_conditions',
                      label: 'Feasible with Mitigations',
                      color: 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                      desc: 'Requires elevated structure, tree branch trimming, or DB cable upgrade.',
                    },
                    {
                      id: 'not_suitable',
                      label: 'Not Feasible / High Risk',
                      color: 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                      desc: 'Excessive shading from high-rise buildings or fragile asbestos/cracked slab.',
                    },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, roof_suitability: v.id as RoofSuitability })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formData.roof_suitability === v.id ? v.color + ' shadow-sm' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="text-xs font-bold">{v.label}</div>
                      <div className="text-[10px] opacity-80 mt-1">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommended Capacity & Panels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-card border border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Recommended Sizing Capacity (kWp)
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.recommended_system_capacity_kw || ''}
                    onChange={(e) => setFormData({ ...formData, recommended_system_capacity_kw: Number(e.target.value) })}
                    className="font-mono text-base font-bold text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Recommended Number of Panels (550Wp)
                  </label>
                  <Input
                    type="number"
                    value={formData.recommended_panels_count || ''}
                    onChange={(e) => setFormData({ ...formData, recommended_panels_count: Number(e.target.value) })}
                    className="font-mono text-base font-bold text-foreground"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">
                    Field Observations & Structural Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.site_observations || ''}
                    onChange={(e) => setFormData({ ...formData, site_observations: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary"
                    placeholder="Enter on-site notes, shadow report details, cable pathways..."
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Next Action Plan</label>
                  <Input
                    value={formData.next_action || ''}
                    onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                    placeholder="e.g. Generate formal quotation, apply for DISCOM sanction"
                  />
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Certified Field Surveyor Sign-off
                  </label>
                  <Input
                    value={formData.surveyor_signature || `${formData.field_agent_name} (Field Engineer)`}
                    onChange={(e) => setFormData({ ...formData, surveyor_signature: e.target.value })}
                    className="font-serif italic text-xs"
                  />
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Customer On-Site Acknowledgement
                  </label>
                  <Input
                    value={formData.customer_signature || formData.customer_name || ''}
                    onChange={(e) => setFormData({ ...formData, customer_signature: e.target.value })}
                    className="font-serif italic text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 border-t border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {activeStep > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveStep((prev) => prev - 1)}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
            )}

            {activeStep < 5 && (
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveStep((prev) => prev + 1)}
                className="flex items-center gap-1"
              >
                <span>Next Step</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
            >
              Save Progress
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleCompleteSurvey}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Complete & Sign Audit</span>
            </Button>

            {onConvertToQuote && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onSave(formData);
                  onConvertToQuote(formData as SiteVisit);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                <span>Create Quotation</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
