import React from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  IndianRupee,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerComplianceDossier } from '../services/compliance-service';

interface DbtReadinessCardProps {
  dossier: CustomerComplianceDossier;
  onSelectCustomer?: (customerName: string) => void;
}

export function DbtReadinessCard({ dossier, onSelectCustomer }: DbtReadinessCardProps) {
  const isReady = dossier.dbt_readiness_percent >= 90;

  const handleOpenNationalPortal = () => {
    window.open('https://pmsuryaghar.gov.in', '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-card via-card to-muted/40 border border-border rounded-xl p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">{dossier.customer_name}</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {dossier.system_capacity_kw} kWp
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span>{dossier.discom_name}</span>
              <span>•</span>
              <span className="font-mono">{dossier.consumer_number}</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
            PM Surya Ghar DBT
          </span>
          <span className="text-lg font-extrabold text-foreground font-mono">
            ₹{dossier.subsidy_claim_amount_inr.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Readiness Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <FileCheck2 className="h-3.5 w-3.5 text-primary" />
            <span>National Portal Subsidy Readiness</span>
          </span>
          <span className="font-mono font-bold text-primary">
            {dossier.dbt_readiness_percent}% ({dossier.verified_docs_count}/{dossier.total_docs_count} Verified)
          </span>
        </div>

        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isReady ? 'bg-emerald-500' : 'bg-primary'
            }`}
            style={{ width: `${dossier.dbt_readiness_percent}%` }}
          />
        </div>
      </div>

      {/* Compliance Checklist Summary */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
        <div className="p-2 rounded-lg bg-card border border-border flex items-center gap-2">
          {dossier.dbt_readiness_percent >= 40 ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          )}
          <span className="truncate">KYC & Bill Verified</span>
        </div>

        <div className="p-2 rounded-lg bg-card border border-border flex items-center gap-2">
          {dossier.dbt_readiness_percent >= 60 ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          )}
          <span className="truncate">ALMM & BIS Passed</span>
        </div>

        <div className="p-2 rounded-lg bg-card border border-border flex items-center gap-2">
          {dossier.dbt_readiness_percent >= 80 ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          )}
          <span className="truncate">DISCOM Net-Meter JIR</span>
        </div>

        <div className="p-2 rounded-lg bg-card border border-border flex items-center gap-2">
          {isReady ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          )}
          <span className="truncate">Geo-Photo & Bank Passbook</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {onSelectCustomer && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectCustomer(dossier.customer_name)}
            className="flex-1 text-xs h-8"
          >
            <span>View All Documents</span>
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          onClick={handleOpenNationalPortal}
          className={`flex-1 text-xs h-8 flex items-center justify-center gap-1.5 ${
            isReady
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          <span>Claim DBT on Portal</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
