import React, { useState } from 'react';
import { X, Wrench, AlertTriangle, ShieldCheck, Calendar, User, Phone, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createServiceTicket,
  ServiceTicket,
  TicketPriority,
  TicketType,
} from '../services/service-tickets-service';

interface CreateServiceTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTicket: ServiceTicket) => void;
}

export function CreateServiceTicketModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateServiceTicketModalProps) {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [systemCapacityKw, setSystemCapacityKw] = useState('5.0');
  const [ticketType, setTicketType] = useState<TicketType>('inverter_fault');
  const [priority, setPriority] = useState<TicketPriority>('high');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [inverterBrand, setInverterBrand] = useState('Sungrow SG5.0RS');
  const [technicianName, setTechnicianName] = useState('Kiran Gowda (O&M Engineer)');
  const [scheduledVisitDate, setScheduledVisitDate] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !title || !description) {
      alert('Please fill in Customer Name, Phone, Title, and Description.');
      return;
    }

    const newTicket = createServiceTicket({
      customer_name: customerName,
      phone,
      address: address || 'Bengaluru',
      city,
      system_capacity_kw: Number(systemCapacityKw) || 5.0,
      ticket_type: ticketType,
      priority,
      title,
      description,
      status: 'assigned',
      assigned_technician_name: (technicianName.split('(')[0] ?? '').trim() || technicianName,
      assigned_technician_phone: '+91 98860 11223',
      scheduled_visit_date: new Date(scheduledVisitDate).toISOString(),
    });

    onSuccess(newTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-5 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Raise Solar AMC / Service Ticket</h3>
              <p className="text-xs text-muted-foreground">Log breakdown, inverter alarm, or preventive maintenance</p>
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
          {/* Ticket Type & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Service Category *</label>
              <select
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value as TicketType)}
                className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background"
              >
                <option value="inverter_fault">Inverter Alarm / Grid Trip</option>
                <option value="breakdown">Zero Generation / Breakdown</option>
                <option value="amc_preventive">Preventive AMC Health Check</option>
                <option value="panel_cleaning">Panel Deep Cleaning Wash</option>
                <option value="net_metering">Net-Metering & Billing Sync</option>
                <option value="warranty_claim">Component Warranty Claim</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Priority / SLA *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background"
              >
                <option value="critical">Critical (4-Hour Response)</option>
                <option value="high">High (Same-Day SLA)</option>
                <option value="medium">Medium (48-Hour SLA)</option>
                <option value="low">Low (Routine AMC)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Ticket Title *</label>
            <Input
              required
              placeholder="e.g. Inverter Error E024 - Grid Over-Voltage"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Customer Name *</label>
              <Input
                required
                placeholder="e.g. Ramesh Kulkarni"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Phone *</label>
              <Input
                required
                placeholder="+91 98400 12345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Site Address</label>
              <Input
                placeholder="Address / Landmark"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">System Size (kWp)</label>
              <Input
                type="number"
                step="0.5"
                value={systemCapacityKw}
                onChange={(e) => setSystemCapacityKw(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Issue Description & Diagnostics *</label>
            <textarea
              required
              rows={3}
              placeholder="Describe symptoms, inverter error codes, weather triggers, or maintenance tasks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-input bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Assign Field O&M Engineer</label>
              <select
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background"
              >
                <option value="Kiran Gowda (O&M Engineer)">Kiran Gowda (Senior Tech)</option>
                <option value="Praveen Kumar (Field Specialist)">Praveen Kumar (Inverter Specialist)</option>
                <option value="Suresh Babu (AMC Lead)">Suresh Babu (Solar Cleaning Team)</option>
                <option value="Unassigned">Unassigned (Queue)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Scheduled Visit Date</label>
              <Input
                type="datetime-local"
                value={scheduledVisitDate}
                onChange={(e) => setScheduledVisitDate(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
              Create Service Ticket
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
