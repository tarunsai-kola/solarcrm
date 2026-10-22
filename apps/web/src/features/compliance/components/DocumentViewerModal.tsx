import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  Calendar,
  User,
  Building2,
  FileText,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComplianceDocument, DocumentVerificationStatus } from '../services/compliance-service';

interface DocumentViewerModalProps {
  document: ComplianceDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (docId: string, status: DocumentVerificationStatus, reason?: string | undefined) => void;
}

export function DocumentViewerModal({
  document,
  isOpen,
  onClose,
  onUpdateStatus,
}: DocumentViewerModalProps) {
  if (!isOpen || !document) return null;

  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = () => {
    onUpdateStatus(document.id, 'verified_approved');
  };

  const handleConfirmReject = () => {
    if (!rejectReason) {
      alert('Please enter a rejection reason.');
      return;
    }
    onUpdateStatus(document.id, 'rejected', rejectReason);
    setIsRejecting(false);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `📑 *KOLA SOLAR — COMPLIANCE DOCUMENT VERIFICATION*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Customer:* ${document.customer_name}\n` +
      `📄 *Document:* ${document.title} (${document.code})\n` +
      `⚡ *DISCOM:* ${document.discom_name} (CA: ${document.consumer_number})\n` +
      `📊 *Status:* *${document.status.replace(/_/g, ' ').toUpperCase()}*\n` +
      (document.rejection_reason ? `⚠️ *Remarks:* ${document.rejection_reason}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Kola Software Solar Compliance & Subsidy Vault`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {document.code}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  document.status === 'verified_approved'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : document.status === 'rejected'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {document.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground mt-1">{document.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customer: <strong className="text-foreground">{document.customer_name}</strong> • {document.discom_name}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Document Preview Area */}
          <div className="rounded-xl border border-border overflow-hidden bg-muted/30 flex flex-col items-center justify-center min-h-[320px]">
            {document.file_url ? (
              <img
                src={document.file_url}
                alt={document.title}
                className="max-h-[340px] w-full object-contain"
              />
            ) : (
              <div className="p-12 text-center text-muted-foreground space-y-2">
                <FileText className="h-12 w-12 mx-auto text-primary" />
                <p className="text-xs">PDF Document: {document.file_size_kb} KB</p>
              </div>
            )}
          </div>

          {/* Rejection Alert if Active */}
          {document.status === 'rejected' && document.rejection_reason && (
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <strong className="block">DISCOM / Compliance Rejection Remarks:</strong>
                <span className="opacity-90">{document.rejection_reason}</span>
              </div>
            </div>
          )}

          {/* Verification Audit Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-border bg-card">
              <span className="text-muted-foreground block text-[10px]">Verification Status</span>
              <div className="font-bold text-foreground capitalize mt-0.5">
                {document.status.replace(/_/g, ' ')}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card">
              <span className="text-muted-foreground block text-[10px]">Audited By</span>
              <div className="font-semibold text-foreground mt-0.5">
                {document.verified_by || 'Pending Auditor Assignment'}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card">
              <span className="text-muted-foreground block text-[10px]">Verification Date</span>
              <div className="font-mono text-foreground mt-0.5">
                {document.verified_at ? new Date(document.verified_at).toLocaleDateString('en-IN') : 'Pending'}
              </div>
            </div>
          </div>

          {/* Rejection Form Input */}
          {isRejecting && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-card space-y-3 animate-in fade-in">
              <label className="text-xs font-semibold text-foreground block">
                Specify Reason for Document Rejection (Requires Customer / EPC Re-upload)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Electricity bill is older than 3 months; CEIG seal missing on SLD..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-input bg-background"
              />
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsRejecting(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleConfirmReject} className="bg-rose-600 text-white hover:bg-rose-700">
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 text-xs"
            >
              <Share2 className="h-3.5 w-3.5 mr-1" />
              <span>WhatsApp</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(document.file_url || '#', '_blank')}
              className="text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              <span>Download File</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {document.status !== 'verified_approved' && (
              <>
                {!isRejecting && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRejecting(true)}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:border-rose-500"
                  >
                    Reject
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApprove}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approve & Verify</span>
                </Button>
              </>
            )}

            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
