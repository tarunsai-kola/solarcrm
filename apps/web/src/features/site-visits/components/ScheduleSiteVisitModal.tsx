import React, { useState } from 'react';
import { X, Calendar, MapPin, User, Phone, Zap, Home, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSiteVisit, SiteVisit } from '../services/site-visits-service';

interface ScheduleSiteVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newVisit: SiteVisit) => void;
}

export function ScheduleSiteVisitModal({
  isOpen,
  onClose,
  onSuccess,
}: ScheduleSiteVisitModalProps) {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [discomName, setDiscomName] = useState('BESCOM (Bengaluru Electricity)');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [scheduledAt, setScheduledAt] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [fieldAgentName, setFieldAgentName] = useState('Rajesh Sharma (Field Engineer)');
  const [roofAreaSqFt, setRoofAreaSqFt] = useState('1000');
  const [monthlyBill, setMonthlyBill] = useState('5000');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address) {
      alert('Please fill in Customer Name, Phone, and Address.');
      return;
    }

    const newVisit = createSiteVisit({
      customer_name: customerName,
      phone,
      email: email || undefined,
      address,
      city,
      discom_name: discomName,
      consumer_number: consumerNumber || `CON-${Math.floor(1000000 + Math.random() * 9000000)}`,
      field_agent_name: (fieldAgentName.split('(')[0] ?? '').trim() || fieldAgentName,
      scheduled_at: new Date(scheduledAt).toISOString(),
      total_roof_area_sqft: Number(roofAreaSqFt) || 800,
      shadow_free_area_sqft: Math.round((Number(roofAreaSqFt) || 800) * 0.7),
      electricity_bill_amount: Number(monthlyBill) || 4500,
      monthly_consumption_kwh: Math.round((Number(monthlyBill) || 4500) / 8),
      recommended_system_capacity_kw: Math.round(((Number(monthlyBill) || 4500) / (8 * 120)) * 2) / 2 || 4.5,
      site_observations: notes || 'Initial technical site visit scheduled.',
      visit_status: 'scheduled',
      roof_suitability: 'highly_suitable',
    });

    onSuccess(newVisit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-5 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Schedule Rooftop Technical Audit</h3>
              <p className="text-xs text-muted-foreground">Dispatch certified field surveyor for structural inspection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Customer Full Name *</label>
            <Input
              required
              placeholder="e.g. Arvind Swamy"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Phone Number *</label>
              <Input
                required
                placeholder="+91 98400 12345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email</label>
              <Input
                type="email"
                placeholder="customer@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Site Address *</label>
            <Input
              required
              placeholder="House/Plot No, Street, Landmark"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">City</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">DISCOM Name</label>
              <Input
                value={discomName}
                onChange={(e) => setDiscomName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Inspection Date & Time</label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Field Surveyor</label>
              <select
                value={fieldAgentName}
                onChange={(e) => setFieldAgentName(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground"
              >
                <option value="Rajesh Sharma (Field Engineer)">Rajesh Sharma (Bangalore East)</option>
                <option value="Ananya Deshmukh (Solar Auditor)">Ananya Deshmukh (Industrial/West)</option>
                <option value="Suresh Babu (Technical Lead)">Suresh Babu (South Hub)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Est. Terrace Area (Sq Ft)</label>
              <Input
                type="number"
                value={roofAreaSqFt}
                onChange={(e) => setRoofAreaSqFt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Monthly Bill (₹)</label>
              <Input
                type="number"
                value={monthlyBill}
                onChange={(e) => setMonthlyBill(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Notes & Special Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bring 15ft extension ladder; customer requests evening visit."
              className="w-full px-3 py-2 text-xs rounded-md border border-input bg-background"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
              Confirm & Schedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
