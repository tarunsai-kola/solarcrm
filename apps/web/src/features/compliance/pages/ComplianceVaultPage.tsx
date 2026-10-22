import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  FolderLock,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Share2,
  Eye,
  FileText,
  Building2,
  ShieldCheck,
  Award,
  Sparkles,
  LayoutGrid,
  List,
  Printer,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  getLocalComplianceDocs,
  getCustomerDossiers,
  updateComplianceDoc,
  ComplianceDocument,
  ComplianceCategory,
  DocumentVerificationStatus,
} from '../services/compliance-service';
import { DbtReadinessCard } from '../components/DbtReadinessCard';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { UploadDocumentModal } from '../components/UploadDocumentModal';

export function ComplianceVaultPage() {
  // State
  const [docs, setDocs] = useState<ComplianceDocument[]>(() => getLocalComplianceDocs());
  const [dossiers, setDossiers] = useState(() => getCustomerDossiers());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ComplianceCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentVerificationStatus>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [activeDoc, setActiveDoc] = useState<ComplianceDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase()) ||
        d.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        d.discom_name.toLowerCase().includes(search.toLowerCase()) ||
        d.consumer_number.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesCustomer = customerFilter === 'all' || d.customer_name === customerFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesCustomer;
    });
  }, [docs, search, categoryFilter, statusFilter, customerFilter]);

  // KPI Metrics
  const totalCount = docs.length;
  const verifiedCount = docs.filter((d) => d.status === 'verified_approved').length;
  const underReviewCount = docs.filter((d) => d.status === 'under_review').length;
  const readyProjectsCount = dossiers.filter((dos) => dos.dbt_readiness_percent >= 90).length;

  const handleUpdateStatus = (
    docId: string,
    newStatus: DocumentVerificationStatus,
    reason?: string | undefined
  ) => {
    const updated = updateComplianceDoc(docId, {
      status: newStatus,
      rejection_reason: reason || undefined,
    });
    if (updated) {
      setDocs(getLocalComplianceDocs());
      setDossiers(getCustomerDossiers());
      setActiveDoc(updated);
    }
  };

  const handleExportZip = () => {
    alert(`Generating DISCOM Net-Metering Compliance Dossier for all ${docs.length} verified documents...`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header & CTAs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <FileCheck2 className="h-4 w-4" />
            DISCOM Net-Metering & Government Subsidy Compliance
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderLock className="h-6 w-6 text-primary" />
            Compliance & Subsidy Document Vault
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centralized repository for customer KYC, ALMM module datasheets, BIS inverter test certificates, bi-directional net-meter JIR reports, and direct benefit transfer (DBT) disbursals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportZip}
            className="flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Export Full Dossier</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setShowUploadModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Documents</p>
              <h3 className="text-2xl font-bold text-foreground font-mono mt-0.5">{totalCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Verified & Approved</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {verifiedCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Under Review / Audit</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                {underReviewCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">DBT Disbursal Ready</p>
              <h3 className="text-2xl font-bold text-primary font-mono mt-0.5">
                {readyProjectsCount} Projects
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer PM Surya Ghar DBT Readiness Dossiers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-500" />
              National Solar Portal DBT Subsidy & Net-Metering Readiness
            </h3>
            <p className="text-xs text-muted-foreground">
              Projects tracked towards the direct ₹78,000 central government subsidy transfer.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dossiers.map((dos) => (
            <DbtReadinessCard
              key={dos.customer_name}
              dossier={dos}
              onSelectCustomer={(cName) => setCustomerFilter(cName)}
            />
          ))}
        </div>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by doc title, code, customer, DISCOM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Customer Filter */}
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-input bg-background"
          >
            <option value="all">All Customer Dossiers</option>
            <option value="Harish Sundaram">Harish Sundaram (5kWp)</option>
            <option value="Pooja Hegde">Pooja Hegde (8kWp)</option>
            <option value="Vikram Mehta (Mehta Industries)">Vikram Mehta (20kWp)</option>
          </select>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                categoryFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Docs
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('kyc_discom')}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                categoryFilter === 'kyc_discom'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              KYC & Bill
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('engineering_bom')}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                categoryFilter === 'engineering_bom'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ALMM & BIS
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('commissioning_jir')}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                categoryFilter === 'commissioning_jir'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Net-Meter JIR
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('subsidy_dbt')}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                categoryFilter === 'subsidy_dbt'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Subsidy DBT
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md ${
                viewMode === 'cards' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Cards vs Table */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <FolderLock className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Compliance Documents Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No documents match your filters. Upload a compliance document or reset filters.
          </p>
          <Button size="sm" onClick={() => setShowUploadModal(true)}>
            Upload Document
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <Card
              key={doc.id}
              className="border-border shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {doc.code}
                    </span>
                    <h3 className="text-sm font-bold text-foreground mt-1.5 group-hover:text-primary transition-colors line-clamp-2">
                      {doc.title}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                      doc.status === 'verified_approved'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : doc.status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {doc.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Customer & DISCOM */}
                <div className="space-y-1 text-xs text-muted-foreground border-y border-border/60 py-2.5">
                  <div className="flex items-center justify-between text-foreground font-semibold">
                    <span>{doc.customer_name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{doc.file_type} ({doc.file_size_kb} KB)</span>
                  </div>
                  <div className="text-[11px] truncate">{doc.discom_name} • CA: {doc.consumer_number}</div>
                </div>

                {/* Audit status note */}
                <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>
                    {doc.verified_by ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Audited: {doc.verified_by}</span>
                    ) : (
                      <span className="text-amber-500">Audit Pending</span>
                    )}
                  </span>
                  <span>{new Date(doc.created_at).toLocaleDateString('en-IN')}</span>
                </div>

                {doc.rejection_reason && (
                  <div className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 truncate">
                    Remarks: {doc.rejection_reason}
                  </div>
                )}
              </CardContent>

              {/* Card Footer */}
              <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  onClick={() => setActiveDoc(doc)}
                  className="w-full text-xs h-8 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Inspect & Verify
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Document Title</th>
                  <th className="p-3.5">Customer & DISCOM</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Auditor</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-primary">{doc.code}</td>
                    <td className="p-3.5 font-medium text-foreground max-w-[240px] truncate">
                      {doc.title}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-foreground">{doc.customer_name}</div>
                      <div className="text-[11px] text-muted-foreground">{doc.discom_name}</div>
                    </td>
                    <td className="p-3.5 capitalize text-muted-foreground">
                      {doc.category.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {doc.verified_by || 'Pending'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          doc.status === 'verified_approved'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : doc.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {doc.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveDoc(doc)}
                        className="text-xs h-7 px-2"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {activeDoc && (
        <DocumentViewerModal
          document={activeDoc}
          isOpen={Boolean(activeDoc)}
          onClose={() => setActiveDoc(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <UploadDocumentModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={(newDoc) => {
            setDocs(getLocalComplianceDocs());
            setDossiers(getCustomerDossiers());
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}
