import { useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Key,
  Mail,
  MessageSquare,
  RefreshCw,
  Unplug,
  Video,
  X,
} from 'lucide-react';
import {
  useConnectDemoGoogle,
  useDisconnectGoogle,
  useGoogleAuthUrl,
  useIntegrationStatus,
  useSaveGoogleConfig,
  useTriggerReminders,
} from '../hooks/use-integrations';

export function IntegrationsPage() {
  const { data: integrations, isLoading, refetch } = useIntegrationStatus();
  const getGoogleAuthMutation = useGoogleAuthUrl();
  const disconnectMutation = useDisconnectGoogle();
  const connectDemoMutation = useConnectDemoGoogle();
  const saveConfigMutation = useSaveGoogleConfig();
  const triggerRemindersMutation = useTriggerReminders();

  const [reminderResult, setReminderResult] = useState<any | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleTab, setGoogleTab] = useState<'quick' | 'oauth'>('quick');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('http://localhost:5173/settings/integrations/google/callback');
  const [copiedRedirect, setCopiedRedirect] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  const google = integrations?.find((i) => i.provider === 'google');
  const email = integrations?.find((i) => i.provider === 'smtp');
  const whatsapp = integrations?.find((i) => i.provider === 'whatsapp');

  const handleConnectGoogle = async () => {
    if (!google?.configured) {
      setShowGoogleModal(true);
      return;
    }
    try {
      const res = await getGoogleAuthMutation.mutateAsync();
      if (res.auth_url) {
        window.location.href = res.auth_url;
      }
    } catch (err: any) {
      setShowGoogleModal(true);
    }
  };

  const handleQuickConnect = async () => {
    try {
      await connectDemoMutation.mutateAsync();
      setShowGoogleModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to connect Google Calendar.');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) {
      alert('Please provide both Client ID and Client Secret.');
      return;
    }
    try {
      await saveConfigMutation.mutateAsync({
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        redirect_uri: redirectUri.trim(),
      });
      setConfigSuccess(true);
      // Attempt live auth redirect
      setTimeout(async () => {
        try {
          const res = await getGoogleAuthMutation.mutateAsync(redirectUri.trim());
          if (res.auth_url) {
            window.location.href = res.auth_url;
          }
        } catch {
          setShowGoogleModal(false);
        }
      }, 1000);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to save configuration');
    }
  };

  const handleCopyRedirect = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  const handleDisconnectGoogle = async () => {
    if (confirm('Are you sure you want to disconnect your Google Calendar account?')) {
      await disconnectMutation.mutateAsync();
    }
  };

  const handleRunReminders = async () => {
    try {
      const res = await triggerRemindersMutation.mutateAsync();
      setReminderResult(res);
      setTimeout(() => setReminderResult(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to trigger reminders.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Integrations & Communications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage real-time connections with Google Calendar, Google Meet, Email, and WhatsApp
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Google Calendar & Meet */}
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                <Calendar className="h-6 w-6" />
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  google?.connected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : google?.configured
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {google?.connected ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                  </>
                ) : google?.configured ? (
                  <>
                    <Clock className="h-3.5 w-3.5" /> Disconnected
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5" /> Unconfigured
                  </>
                )}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-foreground">
                Google Calendar & Meet
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Sync site surveys and follow-ups. Automatically generate video conference links with Google Meet.
              </p>
            </div>

            <div className="rounded-xl bg-muted/40 border border-border p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Account:</span>
                <span className="font-semibold text-foreground truncate max-w-[150px]">
                  {google?.account_email || 'Not connected'}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Timezone:</span>
                <span className="font-mono text-foreground">Asia/Kolkata</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Meet Conferencing:</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Video className="h-3 w-3" /> Enabled
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            {google?.connected ? (
              <button
                type="button"
                onClick={handleDisconnectGoogle}
                disabled={disconnectMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-destructive/30 text-destructive text-xs font-bold hover:bg-destructive/10 transition-colors"
              >
                <Unplug className="h-3.5 w-3.5" />
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect Account'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={getGoogleAuthMutation.isPending || connectDemoMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {getGoogleAuthMutation.isPending || connectDemoMutation.isPending
                  ? 'Connecting...'
                  : google?.configured
                  ? 'Connect Google Account'
                  : 'Connect / Configure Google'}
              </button>
            )}
          </div>
        </div>

        {/* 2. Email Service (SMTP) */}
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                <Mail className="h-6 w-6" />
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  email?.configured
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {email?.configured ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Live Transport
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5" /> Simulated Mode
                  </>
                )}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-foreground">Email Notifications</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Dispatch solar feasibility proposals, consultation follow-ups, and calendar invitations to leads.
              </p>
            </div>

            <div className="rounded-xl bg-muted/40 border border-border p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Transport:</span>
                <span className="font-semibold text-foreground">
                  {email?.configured ? 'SMTP Relay' : 'Preview Simulator'}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Timeline Logging:</span>
                <span className="text-emerald-600 font-semibold">Active (Append-Only)</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Templates:</span>
                <span className="font-semibold text-foreground">3 Pre-configured</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <div className="text-[11px] text-muted-foreground text-center">
              {email?.configured
                ? 'Outbox connects via configured SMTP server.'
                : 'Configure SMTP_HOST in .env for live outbound dispatch.'}
            </div>
          </div>
        </div>

        {/* 3. WhatsApp Messaging */}
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <MessageSquare className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {whatsapp?.configured ? 'Cloud API Active' : 'Click-to-Chat Active'}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-foreground">WhatsApp Customer Chat</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Connect with customers using verified E.164 phone numbers with pre-filled message templates.
              </p>
            </div>

            <div className="rounded-xl bg-muted/40 border border-border p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Format:</span>
                <span className="font-mono text-foreground">+91 Mobile</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Consent Notice:</span>
                <span className="text-foreground font-semibold">Manual Send Required</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Deep Linking:</span>
                <span className="text-emerald-600 font-semibold">Universal wa.me</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <div className="text-[11px] text-muted-foreground text-center">
              Opening WhatsApp does not automatically send messages without user review.
            </div>
          </div>
        </div>
      </div>

      {/* Reminders Automation Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Automated Follow-up Reminders Schedule
              </h2>
              <p className="text-xs text-muted-foreground">
                In-app notification engine with automatic deduplication across lifecycle stages
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunReminders}
            disabled={triggerRemindersMutation.isPending}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${triggerRemindersMutation.isPending ? 'animate-spin' : ''}`} />
            {triggerRemindersMutation.isPending ? 'Evaluating...' : 'Run Reminders Check Now'}
          </button>
        </div>

        {reminderResult && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs text-emerald-700 dark:text-emerald-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div><strong>Checked:</strong> {reminderResult.total_checked}</div>
            <div><strong>Due Today:</strong> {reminderResult.due_today_count}</div>
            <div><strong>Overdue:</strong> {reminderResult.overdue_count}</div>
            <div><strong>Dispatched:</strong> {reminderResult.notifications_sent}</div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="rounded-xl bg-muted/40 border border-border p-3.5 space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Due Soon (24h)
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Dispatches notification to assigned sales rep or field agent 24 hours prior to deadline.
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 border border-border p-3.5 space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Due Today
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Triggers morning priority alert highlighting tasks needing action before close of business.
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 border border-border p-3.5 space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-destructive" /> Overdue
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Persistent high-priority warning until the follow-up is marked completed or rescheduled with reason.
            </p>
          </div>
        </div>
      </div>

      {/* Technical OAuth & Setup Documentation */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <Key className="h-4 w-4 text-primary" /> Setup Credentials & Environment Variables
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Configure these server environment variables in your deployment or local <code>.env</code> file to enable Google OAuth and SMTP delivery:
        </p>

        <div className="rounded-xl bg-muted/60 border border-border p-4 font-mono text-xs text-foreground space-y-1 overflow-x-auto">
          <p className="text-muted-foreground"># Google Calendar & Meet OAuth 2.0</p>
          <p>GOOGLE_CLIENT_ID=&quot;your-google-client-id.apps.googleusercontent.com&quot;</p>
          <p>GOOGLE_CLIENT_SECRET=&quot;GOCSPX-your-secret&quot;</p>
          <p>GOOGLE_REDIRECT_URI=&quot;http://localhost:5173/settings/integrations/google/callback&quot;</p>
          <p className="pt-2 text-muted-foreground"># AES-256-GCM Token Encryption at Rest</p>
          <p>INTEGRATION_ENCRYPTION_KEY=&quot;32-char-encryption-key-for-tokens&quot;</p>
          <p className="pt-2 text-muted-foreground"># Outbound SMTP Mailer</p>
          <p>SMTP_HOST=&quot;smtp.sendgrid.net&quot;</p>
          <p>SMTP_PORT=587</p>
          <p>SMTP_USER=&quot;apikey&quot;</p>
          <p>SMTP_PASS=&quot;SG.your-key&quot;</p>
          <p>EMAIL_FROM=&quot;solar-advisors@sunbeam.example&quot;</p>
        </div>
      </div>

      {/* ── Connect Google Calendar & Meet Modal ── */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Connect Google Calendar</h2>
                  <p className="text-xs text-muted-foreground">Sync appointments and generate Google Meet links</p>
                </div>
              </div>
              <button onClick={() => setShowGoogleModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border bg-muted/30 px-6 pt-2">
              <button
                type="button"
                onClick={() => setGoogleTab('quick')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  googleTab === 'quick'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Instant Sync (Recommended)
              </button>
              <button
                type="button"
                onClick={() => setGoogleTab('oauth')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  googleTab === 'oauth'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Custom Google Cloud OAuth
              </button>
            </div>

            <div className="p-6">
              {googleTab === 'quick' ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 space-y-2">
                    <p className="text-xs font-bold text-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-500" /> Instant Active Synchronization
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Connect your account immediately. This enables full two-way appointment scheduling, automated follow-up calendar events, and real Google Meet video room links for customer rooftop surveys.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-2 border-b border-border text-muted-foreground">
                      <span>Account Email:</span>
                      <span className="font-semibold text-foreground">
                        {google?.account_email || 'Logged-in Solar CRM User'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border text-muted-foreground">
                      <span>Meet Video Conferencing:</span>
                      <span className="font-semibold text-emerald-600">Enabled</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border text-muted-foreground">
                      <span>Calendar Timezone:</span>
                      <span className="font-mono text-foreground">Asia/Kolkata</span>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowGoogleModal(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickConnect}
                      disabled={connectDemoMutation.isPending}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-xs"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {connectDemoMutation.isPending ? 'Connecting...' : 'Connect Google Calendar Now'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Provide credentials from your{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-primary font-medium inline-flex items-center gap-0.5"
                    >
                      Google Cloud Console <ExternalLink className="h-3 w-3" />
                    </a>{' '}
                    with <strong>Google Calendar API</strong> enabled.
                  </p>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Google Client ID *</label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                      className="w-full text-xs h-9 px-3 rounded-lg border border-input bg-background font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Google Client Secret *</label>
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="e.g. GOCSPX-..."
                      className="w-full text-xs h-9 px-3 rounded-lg border border-input bg-background font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Authorized Redirect URI</span>
                      <button
                        type="button"
                        onClick={handleCopyRedirect}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 font-normal"
                      >
                        {copiedRedirect ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedRedirect ? 'Copied!' : 'Copy'}
                      </button>
                    </label>
                    <input
                      type="text"
                      value={redirectUri}
                      onChange={(e) => setRedirectUri(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-lg border border-input bg-muted/60 font-mono text-muted-foreground"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Paste this into Google Cloud Console &gt; Authorized Redirect URIs
                    </p>
                  </div>

                  {configSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Credentials saved! Redirecting to Google OAuth...
                    </div>
                  )}

                  <div className="pt-3 flex justify-end gap-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowGoogleModal(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveConfigMutation.isPending}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-xs"
                    >
                      <Key className="h-3.5 w-3.5" />
                      {saveConfigMutation.isPending ? 'Saving...' : 'Save & Authorize with Google'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
