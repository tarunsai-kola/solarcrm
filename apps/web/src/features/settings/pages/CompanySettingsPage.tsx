import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CreditCard,
  Edit2,
  FileCheck,
  FileText,
  Layers,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Zap,
  Sliders,
} from 'lucide-react';
import { CrmControlsTab } from '../components/CrmControlsTab';
import type {
  CompanyBankAccount,
  CompanyOffice,
  CreateCompanyBankAccount,
  CreateCompanyOffice,
  CreateDefaultQuoteComponent,
  DefaultQuoteComponent,
  UpdateCompanySettings,
} from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useCompanyBankAccounts,
  useCompanyOffices,
  useCompanySettings,
  useCreateCompanyBankAccount,
  useCreateCompanyOffice,
  useCreateDefaultBOMComponent,
  useDefaultBOMComponents,
  useDeleteCompanyBankAccount,
  useDeleteCompanyOffice,
  useDeleteDefaultBOMComponent,
  useUpdateCompanyBankAccount,
  useUpdateCompanyOffice,
  useUpdateCompanySettings,
  useUpdateDefaultBOMComponent,
} from '@/features/quotations/hooks/use-quotations';

export function CompanySettingsPage() {
  const [activeTab, setActiveTab] = useState<'branding' | 'offices' | 'bank' | 'bom' | 'crm'>('branding');

  // Queries
  const { data: settings, isLoading: settingsLoading } = useCompanySettings();
  const { data: offices = [], isLoading: officesLoading } = useCompanyOffices();
  const { data: bankAccounts = [], isLoading: bankLoading } = useCompanyBankAccounts();
  const { data: bomComponents = [], isLoading: bomLoading } = useDefaultBOMComponents();

  // Mutations
  const updateSettingsMutation = useUpdateCompanySettings();
  const createOfficeMutation = useCreateCompanyOffice();
  const updateOfficeMutation = useUpdateCompanyOffice('');
  const deleteOfficeMutation = useDeleteCompanyOffice();

  const createBankMutation = useCreateCompanyBankAccount();
  const updateBankMutation = useUpdateCompanyBankAccount('');
  const deleteBankMutation = useDeleteCompanyBankAccount();

  const createBOMMutation = useCreateDefaultBOMComponent();
  const updateBOMMutation = useUpdateDefaultBOMComponent('');
  const deleteBOMMutation = useDeleteDefaultBOMComponent();

  // Branding Form State
  const [form, setForm] = useState<Partial<UpdateCompanySettings>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Office Modal State
  const [officeModalOpen, setOfficeModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<CompanyOffice | null>(null);
  const [officeForm, setOfficeForm] = useState<CreateCompanyOffice>({
    office_name: '',
    address: '',
    city: 'Kochi',
    state: 'Kerala',
    pincode: '682001',
    phone: '',
    email: '',
    is_headquarters: false,
  });

  // Bank Modal State
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<CompanyBankAccount | null>(null);
  const [bankForm, setBankForm] = useState<CreateCompanyBankAccount>({
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    branch_name: '',
    upi_id: '',
    is_primary: true,
  });

  // BOM Component Modal State
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<DefaultQuoteComponent | null>(null);
  const [bomForm, setBomForm] = useState<CreateDefaultQuoteComponent>({
    name: '',
    component_type: 'solar_panel',
    default_unit: 'Nos',
    default_unit_price: 15000,
    description: '',
    sort_order: 1,
    is_active: true,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        company_name: settings.company_name,
        legal_name: settings.legal_name,
        tagline: settings.tagline,
        credential_line: settings.credential_line,
        gst_number: settings.gst_number,
        pan_number: settings.pan_number,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        logo_url: settings.logo_url,
        product_warranty_years: settings.product_warranty_years,
        performance_warranty_years: settings.performance_warranty_years,
        inverter_warranty_years: settings.inverter_warranty_years,
        battery_warranty_years: settings.battery_warranty_years,
        tax_rate: settings.tax_rate,
        kseb_charges: settings.kseb_charges,
        terms_and_conditions: settings.terms_and_conditions,
      });
    }
  }, [settings]);

  // Handle Save Branding Settings
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      await updateSettingsMutation.mutateAsync(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update company settings');
    }
  };

  // Office actions
  const handleOpenAddOffice = () => {
    if (offices.length >= 6) {
      setErrorMsg('Maximum 6 office locations reached as per organization limits.');
      return;
    }
    setEditingOffice(null);
    setOfficeForm({
      office_name: '',
      address: '',
      city: 'Kochi',
      state: 'Kerala',
      pincode: '682001',
      phone: '',
      email: '',
      is_headquarters: offices.length === 0,
    });
    setOfficeModalOpen(true);
  };

  const handleOpenEditOffice = (office: CompanyOffice) => {
    setEditingOffice(office);
    setOfficeForm({
      office_name: office.office_name,
      address: office.address,
      city: office.city,
      state: office.state,
      pincode: office.pincode,
      phone: office.phone || '',
      email: office.email || '',
      is_headquarters: office.is_headquarters,
    });
    setOfficeModalOpen(true);
  };

  const handleSaveOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOffice) {
        await updateOfficeMutation.mutateAsync(officeForm as any);
      } else {
        await createOfficeMutation.mutateAsync(officeForm);
      }
      setOfficeModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save office');
    }
  };

  const handleDeleteOffice = async (officeId: string) => {
    if (offices.length <= 1) {
      alert('At least 1 office location must be retained for official quotation footers.');
      return;
    }
    if (!confirm('Are you sure you want to remove this office location?')) return;
    try {
      await deleteOfficeMutation.mutateAsync(officeId);
    } catch (err: any) {
      alert(err.message || 'Failed to delete office');
    }
  };

  // Bank actions
  const handleOpenAddBank = () => {
    setEditingBank(null);
    setBankForm({
      bank_name: '',
      account_holder_name: form.legal_name || form.company_name || 'Sunbeam Solar Systems Pvt Ltd',
      account_number: '',
      ifsc_code: '',
      branch_name: '',
      upi_id: '',
      is_primary: bankAccounts.length === 0,
    });
    setBankModalOpen(true);
  };

  const handleOpenEditBank = (bank: CompanyBankAccount) => {
    setEditingBank(bank);
    setBankForm({
      bank_name: bank.bank_name,
      account_holder_name: bank.account_holder_name,
      account_number: bank.account_number,
      ifsc_code: bank.ifsc_code,
      branch_name: bank.branch_name || '',
      upi_id: bank.upi_id || '',
      is_primary: bank.is_primary,
    });
    setBankModalOpen(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBank) {
        await updateBankMutation.mutateAsync(bankForm as any);
      } else {
        await createBankMutation.mutateAsync(bankForm);
      }
      setBankModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save bank account');
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    if (!confirm('Are you sure you want to delete this bank account record?')) return;
    try {
      await deleteBankMutation.mutateAsync(bankId);
    } catch (err: any) {
      alert(err.message || 'Failed to delete bank account');
    }
  };

  // BOM actions
  const handleOpenAddBOM = () => {
    setEditingBOM(null);
    setBomForm({
      name: '',
      component_type: 'other',
      default_unit: 'Nos',
      default_unit_price: 5000,
      description: '',
      sort_order: bomComponents.length + 1,
      is_active: true,
    });
    setBomModalOpen(true);
  };

  const handleOpenEditBOM = (item: DefaultQuoteComponent) => {
    setEditingBOM(item);
    setBomForm({
      name: item.name,
      component_type: item.component_type,
      default_unit: item.default_unit,
      default_unit_price: item.default_unit_price,
      description: item.description || '',
      sort_order: item.sort_order ?? 1,
      is_active: item.is_active,
    });
    setBomModalOpen(true);
  };

  const handleSaveBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBOM) {
        await updateBOMMutation.mutateAsync(bomForm as any);
      } else {
        await createBOMMutation.mutateAsync(bomForm);
      }
      setBomModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save component');
    }
  };

  const handleDeleteBOM = async (id: string) => {
    if (!confirm('Remove this default component from the quotation library?')) return;
    try {
      await deleteBOMMutation.mutateAsync(id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete component');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Company & Quotation Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure authoritative company branding, offices (min 1, max 6), secure bank details, warranties, and the Default Bill of Materials (BOM) library.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-semibold">
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'branding'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Branding & Quotation Rules
        </button>

        <button
          onClick={() => setActiveTab('offices')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'offices'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapPin className="h-4 w-4" />
          Office Locations ({offices.length}/6)
        </button>

        <button
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'bank'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Bank Accounts (Secured)
        </button>

        <button
          onClick={() => setActiveTab('bom')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'bom'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          Default Bill of Materials ({bomComponents.length})
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'crm'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="h-4 w-4" />
          CRM Pipeline & Assignment Controls
        </button>
      </div>

      {/* Tab 1: Company Branding & Warranties */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveBranding} className="space-y-6 max-w-4xl">
          {saveSuccess && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Company settings saved successfully! Future quotations will use these updated defaults.
            </div>
          )}

          {errorMsg && (
            <div className="bg-destructive/15 border border-destructive/30 p-3 rounded-xl flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4" />
              {errorMsg}
            </div>
          )}

          {/* Core Branding */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Brand Identity & Contacts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Company Display Name *</label>
                <Input
                  value={form.company_name || ''}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Legal Entity Name</label>
                <Input
                  value={form.legal_name || ''}
                  onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Marketing Tagline</label>
                <Input
                  value={form.tagline || ''}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Credential Line / Badges</label>
                <Input
                  value={form.credential_line || ''}
                  onChange={(e) => setForm({ ...form, credential_line: e.target.value })}
                  className="h-9 text-xs"
                  placeholder="e.g. MNRE Empanelled Partner • ISO 9001:2015"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Official Email</label>
                <Input
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Official Phone Number</label>
                <Input
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Website URL</label>
                <Input
                  value={form.website || ''}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">GSTIN Number</label>
                <Input
                  value={form.gst_number || ''}
                  onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Warranties & Tax Rates */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Standard Warranties & Quotation Defaults</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">PV Performance (Years)</label>
                <Input
                  type="number"
                  min="5"
                  max="30"
                  value={form.performance_warranty_years ?? 25}
                  onChange={(e) =>
                    setForm({ ...form, performance_warranty_years: parseInt(e.target.value) || 25 })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Inverter Warranty (Years)</label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={form.inverter_warranty_years ?? 5}
                  onChange={(e) =>
                    setForm({ ...form, inverter_warranty_years: parseInt(e.target.value) || 5 })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Workmanship (Years)</label>
                <Input
                  type="number"
                  min="1"
                  max="25"
                  value={form.product_warranty_years ?? 10}
                  onChange={(e) =>
                    setForm({ ...form, product_warranty_years: parseInt(e.target.value) || 10 })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Battery Warranty (Years)</label>
                <Input
                  type="number"
                  min="1"
                  max="15"
                  value={form.battery_warranty_years ?? 5}
                  onChange={(e) =>
                    setForm({ ...form, battery_warranty_years: parseInt(e.target.value) || 5 })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Default Composite GST Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="28"
                  value={form.tax_rate ?? 13.8}
                  onChange={(e) => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 13.8 })}
                  className="h-9 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Composite solar EPC rate (typically 70% goods @ 12% + 30% services @ 18% = 13.8%)
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Default KSEB / DISCOM Statutory Fee (₹)
                </label>
                <Input
                  type="number"
                  step="100"
                  min="0"
                  value={form.kseb_charges ?? 2500}
                  onChange={(e) => setForm({ ...form, kseb_charges: parseFloat(e.target.value) || 0 })}
                  className="h-9 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Statutory feasibility application and meter inspection fees
                </p>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-xs font-semibold text-muted-foreground">Standard Terms & Conditions</label>
              <textarea
                rows={4}
                value={form.terms_and_conditions || ''}
                onChange={(e) => setForm({ ...form, terms_and_conditions: e.target.value })}
                className="w-full text-xs rounded-lg border border-input bg-background p-3 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettingsMutation.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {updateSettingsMutation.isPending ? 'Saving…' : 'Save Company Settings'}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Office Locations (Min 1, Max 6) */}
      {activeTab === 'offices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Configured Office Locations</h3>
              <p className="text-xs text-muted-foreground">
                Minimum 1, maximum 6 offices. These addresses and phone numbers are rendered in the PDF footer.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleOpenAddOffice}
              disabled={offices.length >= 6}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Office ({offices.length}/6)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offices.map((office) => (
              <div
                key={office.id}
                className="rounded-xl border border-border bg-card p-4 space-y-2 relative shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{office.office_name}</span>
                  {office.is_headquarters && (
                    <span className="bg-primary/10 border border-primary/20 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                      Headquarters
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">{office.address}</p>
                <p className="text-xs text-muted-foreground">
                  {office.city}, {office.state} - {office.pincode}
                </p>
                {office.phone && <p className="text-xs text-foreground font-medium">📞 {office.phone}</p>}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditOffice(office)}
                    className="h-7 px-2 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteOffice(office.id)}
                    disabled={offices.length <= 1}
                    className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Bank Accounts (Authorized Admin Only) */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Official Bank Accounts</h3>
              <p className="text-xs text-muted-foreground">
                Official company accounts used for wire/NEFT/RTGS payments in customer quotations. Bank details are never exposed to public endpoints.
              </p>
            </div>
            <Button size="sm" onClick={handleOpenAddBank} className="gap-1.5 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" />
              Add Bank Account
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((bank) => (
              <div
                key={bank.id}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 space-y-3 relative shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-sm text-foreground">{bank.bank_name}</span>
                  </div>
                  {bank.is_primary && (
                    <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full px-2 py-0.5 text-[10px] font-bold">
                      Primary Quotation A/C
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">
                    A/C Holder: <strong className="text-foreground">{bank.account_holder_name}</strong>
                  </p>
                  <p className="text-muted-foreground font-mono">
                    A/C Number: <strong className="text-foreground">{bank.account_number}</strong>
                  </p>
                  <p className="text-muted-foreground font-mono">
                    IFSC: <strong className="text-foreground">{bank.ifsc_code}</strong>
                  </p>
                  {bank.branch_name && <p className="text-muted-foreground">Branch: {bank.branch_name}</p>}
                  {bank.upi_id && <p className="text-muted-foreground">UPI ID: {bank.upi_id}</p>}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditBank(bank)}
                    className="h-7 px-2 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBank(bank.id)}
                    className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Default Bill of Materials (BOM) Library */}
      {activeTab === 'bom' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Default Bill of Materials (BOM) Library</h3>
              <p className="text-xs text-muted-foreground">
                Configurable default components preloaded into every solar proposal. Prices and specifications can be overridden per quotation.
              </p>
            </div>
            <Button size="sm" onClick={handleOpenAddBOM} className="gap-1.5 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" />
              Add Default Component
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-3 w-10">#</th>
                  <th className="py-3 px-3">Component Name</th>
                  <th className="py-3 px-3 w-32">Type</th>
                  <th className="py-3 px-3 w-20">Unit</th>
                  <th className="py-3 px-3 w-28 text-right">Default Rate (₹)</th>
                  <th className="py-3 px-3 w-20 text-center">Status</th>
                  <th className="py-3 px-3 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bomComponents.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 text-muted-foreground">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-foreground">{item.name}</p>
                      {item.description && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-md">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 capitalize text-muted-foreground">
                      {item.component_type.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3">{item.default_unit}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                      ₹{item.default_unit_price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.is_active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditBOM(item)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBOM(item.id)}
                          className="h-7 w-7 p-0 text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: CRM Pipeline & Controls */}
      {activeTab === 'crm' && (
        <div className="pt-2">
          <CrmControlsTab />
        </div>
      )}

      {/* Office Modal */}
      {officeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">
              {editingOffice ? 'Edit Office Location' : 'Add New Office Location'}
            </h3>
            <form onSubmit={handleSaveOffice} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Office Label *</label>
                <Input
                  value={officeForm.office_name}
                  onChange={(e) => setOfficeForm({ ...officeForm, office_name: e.target.value })}
                  placeholder="e.g. Headquarters / Regional Office"
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Street Address *</label>
                <Input
                  value={officeForm.address}
                  onChange={(e) => setOfficeForm({ ...officeForm, address: e.target.value })}
                  placeholder="Building, street name"
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">City *</label>
                  <Input
                    value={officeForm.city}
                    onChange={(e) => setOfficeForm({ ...officeForm, city: e.target.value })}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Pincode *</label>
                  <Input
                    value={officeForm.pincode}
                    onChange={(e) => setOfficeForm({ ...officeForm, pincode: e.target.value })}
                    className="h-8 text-xs"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Contact Phone</label>
                <Input
                  value={officeForm.phone || ''}
                  onChange={(e) => setOfficeForm({ ...officeForm, phone: e.target.value })}
                  placeholder="+91 484 290 8800"
                  className="h-8 text-xs"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={officeForm.is_headquarters}
                  onChange={(e) => setOfficeForm({ ...officeForm, is_headquarters: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary cursor-pointer"
                />
                Mark as Principal Headquarters
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOfficeModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Office
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Modal */}
      {bankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">
              {editingBank ? 'Edit Bank Account' : 'Add Bank Account'}
            </h3>
            <form onSubmit={handleSaveBank} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Bank Name *</label>
                <Input
                  value={bankForm.bank_name}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                  placeholder="e.g. HDFC Bank Ltd"
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Account Holder Name *</label>
                <Input
                  value={bankForm.account_holder_name}
                  onChange={(e) => setBankForm({ ...bankForm, account_holder_name: e.target.value })}
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Account Number *</label>
                <Input
                  value={bankForm.account_number}
                  onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">IFSC Code *</label>
                  <Input
                    value={bankForm.ifsc_code}
                    onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value })}
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Branch Name</label>
                  <Input
                    value={bankForm.branch_name || ''}
                    onChange={(e) => setBankForm({ ...bankForm, branch_name: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">UPI ID (Optional)</label>
                <Input
                  value={bankForm.upi_id || ''}
                  onChange={(e) => setBankForm({ ...bankForm, upi_id: e.target.value })}
                  placeholder="company@bank"
                  className="h-8 text-xs"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={bankForm.is_primary}
                  onChange={(e) => setBankForm({ ...bankForm, is_primary: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary cursor-pointer"
                />
                Set as Primary Account for Quotations
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => setBankModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Bank Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOM Item Modal */}
      {bomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">
              {editingBOM ? 'Edit Default BOM Component' : 'Add BOM Component'}
            </h3>
            <form onSubmit={handleSaveBOM} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Component Name *</label>
                <Input
                  value={bomForm.name}
                  onChange={(e) => setBomForm({ ...bomForm, name: e.target.value })}
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Category *</label>
                  <select
                    value={bomForm.component_type}
                    onChange={(e) => setBomForm({ ...bomForm, component_type: e.target.value as any })}
                    className="h-8 text-xs rounded-md border border-input bg-background px-2 w-full"
                  >
                    <option value="solar_panel">Solar Panel</option>
                    <option value="inverter">Inverter</option>
                    <option value="structure">Structure</option>
                    <option value="bos">BOS / Cables</option>
                    <option value="battery">Battery</option>
                    <option value="net_metering">Net Metering</option>
                    <option value="installation">Installation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Default Unit *</label>
                  <Input
                    value={bomForm.default_unit}
                    onChange={(e) => setBomForm({ ...bomForm, default_unit: e.target.value })}
                    className="h-8 text-xs"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Default Unit Price (₹) *</label>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={bomForm.default_unit_price}
                  onChange={(e) =>
                    setBomForm({ ...bomForm, default_unit_price: parseFloat(e.target.value) || 0 })
                  }
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Description / Specs</label>
                <Input
                  value={bomForm.description || ''}
                  onChange={(e) => setBomForm({ ...bomForm, description: e.target.value })}
                  placeholder="Material specs, warranty, ratings..."
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => setBomModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Component
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
