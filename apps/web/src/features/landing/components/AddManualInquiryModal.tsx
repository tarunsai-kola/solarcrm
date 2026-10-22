import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Send,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useLandingInquiries } from '../hooks/use-landing-inquiries';

interface AddManualInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddManualInquiryModal({ isOpen, onClose }: AddManualInquiryModalProps) {
  const { submitInquiry } = useLandingInquiries();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Name, Phone, and Address are required.',
      });
      return;
    }

    setIsSubmitting(true);
    submitInquiry({
      customer_name: name.trim(),
      email: email.trim() || 'inquiry@directsolar.com',
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim() || 'Direct Branch',
      company_name: company.trim() || 'Direct Client',
      business_type: 'epc',
      lead_volume: 'Standard',
      system_interest: 'Direct Solar Installation',
      notes: notes.trim() || 'Captured via Admin Inquiries Management Portal',
      source: 'Direct Admin Capture',
    });

    setIsSubmitting(false);
    toast({
      title: 'Inquiry Added',
      description: `New lead "${name}" added to inquiries portal.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-slate-900 border-slate-700 shadow-2xl rounded-2xl overflow-hidden p-0">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Manual Solar Inquiry</h3>
              <p className="text-xs text-slate-400">Log an incoming call or walk-in solar lead</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Customer / Contact Name *</label>
            <Input
              placeholder="e.g. Anand Mahindra"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Phone Number *</label>
              <Input
                placeholder="+91 98765 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address</label>
              <Input
                placeholder="anand@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Physical Address / Site Location *</label>
            <Input
              placeholder="Building No, Industrial Phase, Street, City"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Company / Organization</label>
              <Input
                placeholder="e.g. Solar Rooftop Infra"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">City / State</label>
              <Input
                placeholder="Pune, Maharashtra"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Initial Notes / Requirements</label>
            <textarea
              rows={2}
              placeholder="e.g. Customer called inquiring about 40kW residential society solar subsidy..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md bg-slate-950 border border-slate-700 text-xs text-white p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-xs text-slate-400">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
            >
              Save Inquiry
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
