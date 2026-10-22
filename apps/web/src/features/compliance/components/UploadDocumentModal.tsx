import React, { useState } from 'react';
import { X, Upload, FileCheck2, Building2, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  uploadComplianceDoc,
  ComplianceCategory,
  ComplianceDocument,
} from '../services/compliance-service';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoc: ComplianceDocument) => void;
}

export function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadDocumentModalProps) {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState('Harish Sundaram');
  const [discomName, setDiscomName] = useState('BESCOM');
  const [consumerNumber, setConsumerNumber] = useState('BES-10492819');
  const [category, setCategory] = useState<ComplianceCategory>('engineering_bom');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('DOC-DCR-08');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !title || !code) {
      alert('Please fill in Customer Name, Document Title, and Code.');
      return;
    }

    const newDoc = uploadComplianceDoc({
      customer_name: customerName,
      project_id: customerName.includes('Harish') ? 'proj-001' : customerName.includes('Pooja') ? 'proj-002' : 'proj-003',
      discom_name: discomName,
      consumer_number: consumerNumber,
      category,
      title,
      code,
      file_type: 'pdf',
      notes,
    });

    onSuccess(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-5 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Upload Compliance Document</h3>
              <p className="text-xs text-muted-foreground">Add KYC, ALMM certificate, or DISCOM commissioning report</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Customer Dossier *</label>
              <select
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (e.target.value.includes('Pooja')) {
                    setConsumerNumber('BES-88419201');
                  } else if (e.target.value.includes('Vikram')) {
                    setConsumerNumber('BES-99210492');
                  } else {
                    setConsumerNumber('BES-10492819');
                  }
                }}
                className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background"
              >
                <option value="Harish Sundaram">Harish Sundaram (5kWp)</option>
                <option value="Pooja Hegde">Pooja Hegde (8kWp)</option>
                <option value="Vikram Mehta (Mehta Industries)">Vikram Mehta (20kWp)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Compliance Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplianceCategory)}
                className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background"
              >
                <option value="kyc_discom">KYC & DISCOM Bill</option>
                <option value="engineering_bom">ALMM & Inverter BIS Cert</option>
                <option value="commissioning_jir">Net-Meter JIR Report</option>
                <option value="subsidy_dbt">Subsidy DBT Photo & Passbook</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Document Title *</label>
            <Input
              required
              placeholder="e.g. Domestic Content Requirement (DCR) Module Certificate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Document Code *</label>
              <Input
                required
                placeholder="e.g. DOC-DCR-08"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">DISCOM Consumer No.</label>
              <Input
                value={consumerNumber}
                onChange={(e) => setConsumerNumber(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Notes / Auditor Remarks</label>
            <textarea
              rows={2}
              placeholder="e.g. Verified against MNRE ALMM order dated 1st March 2026."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-input bg-background"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
              Upload Document
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
