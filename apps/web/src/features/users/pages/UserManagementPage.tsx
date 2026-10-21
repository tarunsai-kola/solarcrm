import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  MapPin,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import type { AppRole, CreateFieldAgent, CreateInboundSales, Profile } from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

interface UserWithDetails extends Profile {
  field_agent_profiles?: {
    address: string | null;
    pincode: string | null;
    service_areas: string[];
    service_pincodes: string[];
    max_active_leads: number;
    availability: string;
    experience_years: number;
  } | null;
}

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [showFieldAgentModal, setShowFieldAgentModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [recoveryLinkData, setRecoveryLinkData] = useState<{ name: string; link: string } | null>(null);

  // ─── Fetch Users Query ───────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users', { roleFilter, statusFilter, searchTerm }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (roleFilter !== 'all') params['role'] = roleFilter;
      if (statusFilter !== 'all') params['account_status'] = statusFilter;
      if (searchTerm) params['search'] = searchTerm;

      const res = await apiClient.get('/users', { params });
      return res.data.data as { items: UserWithDetails[]; total: number };
    },
  });

  const users = data?.items ?? [];

  // Summary counts
  const totalCount = data?.total ?? users.length;
  const salesCount = users.filter((u) => u.role === 'inbound_sales').length;
  const agentsCount = users.filter((u) => u.role === 'field_agent').length;
  const inactiveCount = users.filter((u) => u.account_status !== 'active').length;

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const createInboundMutation = useMutation({
    mutationFn: async (payload: CreateInboundSales) => {
      const res = await apiClient.post('/users/inbound-sales', payload);
      return res.data.data;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowInboundModal(false);
      toast({
        title: 'Account created successfully',
        description: `Inbound Sales account created for ${resData.user.full_name}.`,
      });
      if (resData.inviteLink) {
        setRecoveryLinkData({ name: resData.user.full_name, link: resData.inviteLink });
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message ?? err.message ?? 'Failed to create user';
      toast({ variant: 'destructive', title: 'Error creating account', description: msg });
    },
  });

  const createFieldAgentMutation = useMutation({
    mutationFn: async (payload: CreateFieldAgent) => {
      const res = await apiClient.post('/users/field-agent', payload);
      return res.data.data;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowFieldAgentModal(false);
      toast({
        title: 'Field Agent created successfully',
        description: `Technical Agent account created for ${resData.user.full_name}.`,
      });
      if (resData.inviteLink) {
        setRecoveryLinkData({ name: resData.user.full_name, link: resData.inviteLink });
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message ?? err.message ?? 'Failed to create field agent';
      toast({ variant: 'destructive', title: 'Error creating account', description: msg });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: 'active' | 'suspended' }) => {
      const res = await apiClient.post(`/users/${userId}/status`, { account_status: newStatus });
      return res.data.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'User status updated',
        description: `Account has been ${vars.newStatus === 'active' ? 'activated' : 'suspended'}.`,
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message ?? err.message ?? 'Failed to update status';
      toast({ variant: 'destructive', title: 'Action failed', description: msg });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.post(`/users/${userId}/reset-password`);
      return res.data.data;
    },
    onSuccess: (resData) => {
      if (resData.recoveryLink) {
        setRecoveryLinkData({ name: resData.message ?? 'User', link: resData.recoveryLink });
      }
      toast({
        title: 'Password reset generated',
        description: 'Secure access link is ready.',
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message ?? err.message ?? 'Failed to reset password';
      toast({ variant: 'destructive', title: 'Reset failed', description: msg });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const res = await apiClient.patch(`/users/${userId}`, updates);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      toast({
        title: 'Profile updated',
        description: 'User details have been successfully saved.',
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message ?? err.message ?? 'Failed to update profile';
      toast({ variant: 'destructive', title: 'Update failed', description: msg });
    },
  });

  return (
    <div className="space-y-6">
      {/* ── Top Header & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User Management & Access Control
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create, audit, and manage role authorizations for Inbound Sales and Field Technical Agents.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setShowInboundModal(true)}
            variant="outline"
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
            id="add-inbound-sales-btn"
          >
            <UserPlus className="h-4 w-4" />
            Add Inbound Sales
          </Button>
          <Button
            onClick={() => setShowFieldAgentModal(true)}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            id="add-field-agent-btn"
          >
            <Plus className="h-4 w-4" />
            Add Field Agent
          </Button>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Accounts</p>
              <p className="text-xl font-bold text-foreground">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Inbound Sales Reps</p>
              <p className="text-xl font-bold text-foreground">{salesCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Field Agents</p>
              <p className="text-xl font-bold text-foreground">{agentsCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Inactive / Suspended</p>
              <p className="text-xl font-bold text-foreground">{inactiveCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-card rounded-lg border border-border/70 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-muted-foreground px-1">Role:</span>
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'admin', label: 'Admins' },
            { id: 'inbound_sales', label: 'Inbound Sales' },
            { id: 'field_agent', label: 'Field Agents' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                roleFilter === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, email, phone…"
              className="pl-8 text-xs h-8"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs h-8 px-2.5 rounded-md border border-input bg-background text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button onClick={() => refetch()} variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="rounded-lg border border-border/70 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3">User & Contact</th>
                <th className="px-4 py-3">Role & Access</th>
                <th className="px-4 py-3">Assigned Service Areas</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created / Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && <TableSkeleton rows={4} cols={6} />}

              {isError && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-destructive">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                    Failed to load users. Please check server logs.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No users match the selected filters.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                users.map((user) => {
                  const isAgent = user.role === 'field_agent';
                  const agentDetails = user.field_agent_profiles;

                  return (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name & Contact */}
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {user.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-foreground font-semibold">{user.full_name}</div>
                            <div className="text-muted-foreground text-[11px]">{user.email}</div>
                            {user.phone && (
                              <div className="text-muted-foreground text-[11px]">{user.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>

                      {/* Service Areas / Capacity */}
                      <td className="px-4 py-3">
                        {isAgent && agentDetails ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {agentDetails.service_areas?.length > 0 ? (
                                agentDetails.service_areas.map((area, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground border border-border"
                                  >
                                    <MapPin className="h-2.5 w-2.5" />
                                    {area}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-[11px]">No areas assigned</span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Max Capacity: {agentDetails.max_active_leads} leads • {agentDetails.availability}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Organization-wide</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={user.account_status} />
                      </td>

                      {/* Timestamps */}
                      <td className="px-4 py-3 text-muted-foreground text-[11px]">
                        <div>Created: {new Date(user.created_at).toLocaleDateString()}</div>
                        <div>Updated: {new Date(user.updated_at).toLocaleDateString()}</div>
                      </td>

                      {/* Action Menu */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setEditingUser(user)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => resetPasswordMutation.mutate(user.id)}
                            title="Generate password reset link"
                          >
                            <KeyRound className="h-3 w-3" />
                            Reset Link
                          </Button>
                          {user.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant={user.account_status === 'active' ? 'destructive' : 'outline'}
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                toggleStatusMutation.mutate({
                                  userId: user.id,
                                  newStatus: user.account_status === 'active' ? 'suspended' : 'active',
                                })
                              }
                            >
                              {user.account_status === 'active' ? 'Suspend' : 'Activate'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Create Inbound Sales ── */}
      {showInboundModal && (
        <CreateInboundSalesModal
          onClose={() => {
            setShowInboundModal(false);
            createInboundMutation.reset();
          }}
          onSubmit={(data) => createInboundMutation.mutate(data)}
          isLoading={createInboundMutation.isPending}
          error={createInboundMutation.error}
        />
      )}

      {/* ── Modal: Create Field Agent ── */}
      {showFieldAgentModal && (
        <CreateFieldAgentModal
          onClose={() => {
            setShowFieldAgentModal(false);
            createFieldAgentMutation.reset();
          }}
          onSubmit={(data) => createFieldAgentMutation.mutate(data)}
          isLoading={createFieldAgentMutation.isPending}
          error={createFieldAgentMutation.error}
        />
      )}

      {/* ── Modal: Edit User Profile ── */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={(updates) => updateProfileMutation.mutate({ userId: editingUser.id, updates })}
          isLoading={updateProfileMutation.isPending}
        />
      )}

      {/* ── Modal: Generated Recovery Link ── */}
      {recoveryLinkData && (
        <RecoveryLinkModal
          data={recoveryLinkData}
          onClose={() => setRecoveryLinkData(null)}
        />
      )}
    </div>
  );
}

// ─── Helpers: Badges ─────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: AppRole }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        <ShieldCheck className="h-3 w-3" />
        Admin
      </span>
    );
  }
  if (role === 'inbound_sales') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary border border-primary/30">
        <UserCheck className="h-3 w-3" />
        Inbound Sales
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
      <Wrench className="h-3 w-3" />
      Field Agent
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-destructive/15 text-destructive border border-destructive/30">
      <UserX className="h-3 w-3" />
      {status === 'suspended' ? 'Suspended' : 'Inactive'}
    </span>
  );
}

// ─── Modal 1: Create Inbound Sales Modal ──────────────────────────────────────
function CreateInboundSalesModal({
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  onClose: () => void;
  onSubmit: (data: CreateInboundSales) => void;
  isLoading: boolean;
  error?: any;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateInboundSales>({
    defaultValues: { send_invite: true },
  });

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Create Inbound Sales Account</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3.5 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Account Creation Failed</span>
                </div>
                <p className="text-[12px] pl-6 text-foreground/90 font-medium">
                  {error.response?.data?.error?.message ?? error.message ?? 'An unexpected error occurred'}
                </p>
                {(error.response?.data?.error?.message?.includes('User not allowed') ||
                  error.response?.data?.error?.code === 'USER_CREATION_FAILED') && (
                  <div className="pl-6 pt-1 text-[11px] text-muted-foreground leading-relaxed border-t border-destructive/20 mt-2">
                    <p>
                      <strong className="text-foreground">Why this happens:</strong> Supabase Auth requires your project&apos;s secret <code>service_role</code> key to provision new user accounts.
                    </p>
                    <p className="mt-1">
                      👉 Copy the <strong>service_role</strong> key from your <a href="https://supabase.com/dashboard/project/ixncpmlhfzeoxxtjyzum/settings/api" target="_blank" rel="noreferrer" className="underline text-primary font-medium">Supabase API Settings</a> and paste it as <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>apps/api/.env</code>.
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold">Full Name *</label>
              <Input {...register('full_name', { required: 'Full name is required' })} placeholder="e.g. Priya Sharma" />
              {errors.full_name && <p className="text-[11px] text-destructive">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Email Address *</label>
              <Input type="email" {...register('email', { required: 'Email is required' })} placeholder="priya@solardemo.local" />
              {errors.email && <p className="text-[11px] text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Phone Number *</label>
              <Input {...register('phone', { required: 'Phone number is required' })} placeholder="+91 98765 43210" />
              {errors.phone && <p className="text-[11px] text-destructive">{errors.phone.message}</p>}
            </div>

            {/* Prominent Login Password Box */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Initial Password (Optional)
                </label>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">
                  Optional
                </span>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Set initial password (min. 6 chars) or leave blank"
                  className="pr-10 bg-background text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Set a password now so the user can log in immediately, or leave blank to auto-generate a secure temporary password.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="send_invite_cb" {...register('send_invite')} className="rounded border-input" />
              <label htmlFor="send_invite_cb" className="text-xs font-medium text-foreground">
                Generate secure invitation & password setup link
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-3 border-t border-border bg-card shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create Inbound Sales Rep
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal 2: Create Field Agent Modal ────────────────────────────────────────
function CreateFieldAgentModal({
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  onClose: () => void;
  onSubmit: (data: CreateFieldAgent) => void;
  isLoading: boolean;
  error?: any;
}) {
  const [areasInput, setAreasInput] = useState('');
  const [pincodesInput, setPincodesInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFieldAgent>({
    defaultValues: {
      max_active_leads: 15,
      availability: 'available',
      experience_years: 2,
      send_invite: true,
    },
  });

  function handleFormSubmit(values: CreateFieldAgent) {
    const areas = areasInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const pincodes = pincodesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onSubmit({
      ...values,
      service_areas: areas.length > 0 ? areas : ['Pune Metro'],
      service_pincodes: pincodes,
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-emerald-500" />
            <h2 className="text-base font-bold text-foreground">Create Field Technical Agent</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3.5 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Account Creation Failed</span>
                </div>
                <p className="text-[12px] pl-6 text-foreground/90 font-medium">
                  {error.response?.data?.error?.message ?? error.message ?? 'An unexpected error occurred'}
                </p>
                {(error.response?.data?.error?.message?.includes('User not allowed') ||
                  error.response?.data?.error?.code === 'USER_CREATION_FAILED') && (
                  <div className="pl-6 pt-1 text-[11px] text-muted-foreground leading-relaxed border-t border-destructive/20 mt-2">
                    <p>
                      <strong className="text-foreground">Why this happens:</strong> Supabase Auth requires your project&apos;s secret <code>service_role</code> key to provision new user accounts.
                    </p>
                    <p className="mt-1">
                      👉 Copy the <strong>service_role</strong> key from your <a href="https://supabase.com/dashboard/project/ixncpmlhfzeoxxtjyzum/settings/api" target="_blank" rel="noreferrer" className="underline text-primary font-medium">Supabase API Settings</a> and paste it as <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>apps/api/.env</code>.
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Full Name *</label>
                <Input {...register('full_name', { required: 'Full name required' })} placeholder="e.g. Amit Verma" />
                {errors.full_name && <p className="text-[11px] text-destructive">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Phone Number *</label>
                <Input {...register('phone', { required: 'Phone required' })} placeholder="+91 98765 11111" />
                {errors.phone && <p className="text-[11px] text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Email Address *</label>
              <Input type="email" {...register('email', { required: 'Email required' })} placeholder="amit@solardemo.local" />
              {errors.email && <p className="text-[11px] text-destructive">{errors.email.message}</p>}
            </div>

            {/* Prominent Login Password Box */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-emerald-500" />
                  Initial Login Password (Optional)
                </label>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">
                  Optional
                </span>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Set initial password (min. 6 chars) or leave blank"
                  className="pr-10 bg-background text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Set a password now so the agent can log in at the Field Agent Portal (<code>/field-agent-login</code>) immediately.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold">Base Address *</label>
                <Input {...register('address', { required: 'Address required' })} placeholder="Street / Area / Office base" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Pincode *</label>
                <Input {...register('pincode', { required: 'Pincode required' })} placeholder="411045" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Assigned Service Areas * (comma-separated)</label>
              <Input
                value={areasInput}
                onChange={(e) => setAreasInput(e.target.value)}
                placeholder="e.g. Baner, Hinjawadi, Aundh, Kothrud"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Assigned Service Pincodes (comma-separated)</label>
              <Input
                value={pincodesInput}
                onChange={(e) => setPincodesInput(e.target.value)}
                placeholder="e.g. 411045, 411057, 411007"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Active Lead Capacity</label>
                <Input type="number" {...register('max_active_leads')} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Availability</label>
                <select
                  {...register('availability')}
                  className="w-full text-xs h-9 px-2.5 rounded-md border border-input bg-background"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="on_leave">On Leave</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Experience (Years)</label>
                <Input type="number" step="0.5" {...register('experience_years')} />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="agent_send_invite_cb" {...register('send_invite')} className="rounded border-input" />
              <label htmlFor="agent_send_invite_cb" className="text-xs font-medium text-foreground">
                Generate secure invitation & password setup link
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-3 border-t border-border bg-card shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Create Field Agent
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal 3: Edit User Modal ────────────────────────────────────────────────
function EditUserModal({
  user,
  onClose,
  onSubmit,
  isLoading,
}: {
  user: UserWithDetails;
  onClose: () => void;
  onSubmit: (updates: any) => void;
  isLoading: boolean;
}) {
  const isAgent = user.role === 'field_agent';
  const agentProfile = user.field_agent_profiles;

  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [address, setAddress] = useState(agentProfile?.address ?? '');
  const [pincode, setPincode] = useState(agentProfile?.pincode ?? '');
  const [serviceAreas, setServiceAreas] = useState(agentProfile?.service_areas?.join(', ') ?? '');
  const [servicePincodes, setServicePincodes] = useState(agentProfile?.service_pincodes?.join(', ') ?? '');
  const [maxLeads, setMaxLeads] = useState(agentProfile?.max_active_leads ?? 15);
  const [availability, setAvailability] = useState(agentProfile?.availability ?? 'available');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleSave() {
    const updates: Record<string, any> = {
      full_name: fullName,
      phone,
    };

    if (password && password.trim().length >= 6) {
      updates['password'] = password.trim();
    }

    if (isAgent) {
      updates['address'] = address;
      updates['pincode'] = pincode;
      updates['service_areas'] = serviceAreas.split(',').map((s) => s.trim()).filter(Boolean);
      updates['service_pincodes'] = servicePincodes.split(',').map((s) => s.trim()).filter(Boolean);
      updates['max_active_leads'] = Number(maxLeads);
      updates['availability'] = availability;
    }

    onSubmit(updates);
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Edit Profile & Credentials</h2>
              <p className="text-xs text-muted-foreground">{user.email} • {user.role.replace('_', ' ').toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Full Name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Phone Number</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          {/* Prominent Login Password Section (Visible Immediately) */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-primary" />
                Set / Reset Login Password
              </label>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">
                {password.length >= 6 ? '✓ Ready to update' : 'Optional'}
              </span>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="pr-10 bg-background text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Enter a password to instantly update this account's credentials so the user can log in with this new password immediately.
            </p>
          </div>

          {isAgent && (
            <div className="space-y-3 pt-2 border-t border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Field Territory & Capacity
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold">Base Address</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Pincode</label>
                  <Input value={pincode} onChange={(e) => setPincode(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Assigned Service Areas</label>
                <Input
                  value={serviceAreas}
                  onChange={(e) => setServiceAreas(e.target.value)}
                  placeholder="Baner, Hinjawadi, Aundh"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Service Pincodes</label>
                <Input
                  value={servicePincodes}
                  onChange={(e) => setServicePincodes(e.target.value)}
                  placeholder="411045, 411057"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Max Active Leads</label>
                  <Input
                    type="number"
                    value={maxLeads}
                    onChange={(e) => setMaxLeads(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Availability</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full text-xs h-9 px-2.5 rounded-md border border-input bg-background"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="on_leave">On Leave</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer: Always Visible */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card shrink-0">
          <span className="text-[11px] text-muted-foreground">
            {password.length > 0 && password.length < 6
              ? '⚠️ Password must be at least 6 characters'
              : password.length >= 6
              ? '🔑 Password will be reset upon saving'
              : 'Leave password blank to keep current credentials'}
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              isLoading={isLoading}
              disabled={isLoading || (password.length > 0 && password.length < 6)}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal 4: Recovery Link Modal ─────────────────────────────────────────────
function RecoveryLinkModal({
  data,
  onClose,
}: {
  data: { name: string; link: string };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(data.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold">
          <KeyRound className="h-5 w-5" />
          <h2 className="text-base text-foreground">Secure Access / Reset Link Generated</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          A secure password recovery/invitation link has been generated for{' '}
          <strong className="text-foreground">{data.name}</strong>. Provide this link to the user to allow them to configure their password:
        </p>

        <div className="p-2.5 rounded-md bg-muted border border-border text-xs break-all font-mono text-foreground select-all">
          {data.link}
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5 text-xs">
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copied to clipboard!' : 'Copy Link'}
          </Button>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
