import {
  Check,
  Mail,
  Phone,
  Shield,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useLandingInquiries } from '../hooks/use-landing-inquiries';
import type { LandingInquiry, Salesperson } from '../services/landing-leads-service';

interface AssignSalespersonModalProps {
  inquiry: LandingInquiry;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AssignSalespersonModal({
  inquiry,
  isOpen,
  onClose,
  onSuccess,
}: AssignSalespersonModalProps) {
  const { salespersons, assignSalesperson } = useLandingInquiries();
  const [selectedId, setSelectedId] = useState<string>(
    inquiry.assigned_salesperson_id || salespersons[0]?.id || '',
  );
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setIsSubmitting(true);
    let chosenRep: { id: string; name: string; email: string; role?: string } | null = null;

    if (isCustomMode) {
      if (!customName.trim()) {
        toast({
          variant: 'destructive',
          title: 'Salesperson Name Required',
          description: 'Please specify the name of the sales representative.',
        });
        setIsSubmitting(false);
        return;
      }
      chosenRep = {
        id: `custom-sp-${Date.now()}`,
        name: customName.trim(),
        email: customEmail.trim() || 'sales@kolasoftware.com',
        role: 'Designated Sales Executive',
      };
    } else {
      const match = salespersons.find((s) => s.id === selectedId);
      if (match) {
        chosenRep = {
          id: match.id,
          name: match.name,
          email: match.email,
          role: match.role,
        };
      }
    }

    if (!chosenRep) {
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      assignSalesperson(inquiry.id, chosenRep, 'Admin Executive');
      setIsSubmitting(false);
      toast({
        title: 'Salesperson Assigned',
        description: `Lead from "${inquiry.customer_name}" was successfully assigned to ${chosenRep.name}.`,
      });
      onSuccess?.();
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-xl bg-slate-900 border-slate-700 shadow-2xl rounded-2xl overflow-hidden p-0">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Assign Lead to Salesperson</h3>
              <p className="text-xs text-slate-400">
                Route inquiry <span className="font-mono text-amber-400">#{inquiry.id}</span> to a certified sales consultant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Context Summary Box */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 text-xs text-slate-300 grid grid-cols-2 gap-2">
          <div>
            <span className="text-slate-500 block">Customer & Company:</span>
            <span className="font-semibold text-white">{inquiry.customer_name}</span>
            <span className="text-slate-400 block truncate">{inquiry.company_name || 'Individual Solar Buyer'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Site Location / Address:</span>
            <span className="text-white block truncate">{inquiry.address}</span>
            <span className="text-slate-400 block">{inquiry.city || 'Regional Center'}</span>
          </div>
        </div>

        {/* Selection Area */}
        <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Available Solar Sales Representatives
            </label>
            <button
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="text-xs text-amber-400 hover:underline"
            >
              {isCustomMode ? '← Pick from Team List' : '+ Assign Other / Custom Person'}
            </button>
          </div>

          {!isCustomMode ? (
            <div className="space-y-2">
              {salespersons.map((sp) => {
                const isSelected = selectedId === sp.id;
                return (
                  <div
                    key={sp.id}
                    onClick={() => setSelectedId(sp.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                        : 'bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {sp.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{sp.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {sp.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {sp.email}
                          </span>
                          {sp.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {sp.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {sp.activeLeadsCount !== undefined && (
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          {sp.activeLeadsCount} active
                        </span>
                      )}
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Salesperson Full Name *</label>
                <Input
                  placeholder="e.g. Ramesh Chandra"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email / Phone (Optional)</label>
                <Input
                  placeholder="ramesh@solarpower.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>
            </div>
          )}

          {/* Optional Note to Salesperson */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Internal Instructions / Handover Note (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. High priority client. Send 3D shading assessment before scheduled Friday call."
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value)}
              className="w-full rounded-md bg-slate-950 border border-slate-700 text-xs text-white p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs px-5"
          >
            {isSubmitting ? 'Assigning...' : 'Assign & Notify Salesperson'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
