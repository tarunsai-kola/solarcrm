import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, UserCheck, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import type { AppRole } from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PortalMismatchError, useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

interface RolePortalConfig {
  role: AppRole;
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeColor: string;
  icon: typeof ShieldCheck;
  accentGradient: string;
}

const PORTAL_CONFIGS: Record<AppRole, RolePortalConfig> = {
  admin: {
    role: 'admin',
    title: 'Executive Admin Portal',
    subtitle: 'System administration, user access control, and organization settings',
    badgeLabel: 'Administrator Access',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    icon: ShieldCheck,
    accentGradient: 'from-amber-500 to-orange-600',
  },
  inbound_sales: {
    role: 'inbound_sales',
    title: 'Inbound Sales Operations',
    subtitle: 'Lead qualification, lead distribution, and quotation pipeline management',
    badgeLabel: 'Sales Operations',
    badgeColor: 'bg-primary/15 text-primary border-primary/30',
    icon: UserCheck,
    accentGradient: 'from-primary to-amber-500',
  },
  field_agent: {
    role: 'field_agent',
    title: 'Field Technical Agent Portal',
    subtitle: 'On-site surveys, roof suitability assessments, and technical audits',
    badgeLabel: 'Field Operations',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    icon: Wrench,
    accentGradient: 'from-emerald-500 to-teal-600',
  },
};

export function RoleLoginPage({ portalRole }: { portalRole: AppRole }) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mismatchData, setMismatchData] = useState<{ actualRole: AppRole; correctPortalUrl: string } | null>(null);

  const config = PORTAL_CONFIGS[portalRole];
  const IconComponent = config.icon;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    setErrorMessage(null);
    setMismatchData(null);
    try {
      await signIn(values.email, values.password, portalRole);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof PortalMismatchError) {
        setMismatchData({
          actualRole: err.actualRole,
          correctPortalUrl: err.correctPortalUrl,
        });
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Authentication failed. Please verify your credentials.');
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header Badge & Title ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeColor}`}>
            <IconComponent className="h-3.5 w-3.5" />
            {config.badgeLabel}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{config.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{config.subtitle}</p>
      </div>

      {/* ── Portal Mismatch Alert Banner ── */}
      {mismatchData && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-destructive">Portal Access Denied</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your credentials are valid, but your account is registered as{' '}
                <span className="font-semibold text-foreground capitalize">
                  {mismatchData.actualRole.replace('_', ' ')}
                </span>
                . Access through this portal is restricted.
              </p>
            </div>
          </div>
          <Link
            to={mismatchData.correctPortalUrl}
            className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
          >
            Go to {mismatchData.actualRole.replace('_', ' ')} Portal
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ── Generic Error Banner ── */}
      {errorMessage && !mismatchData && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* ── Form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor={`${portalRole}-email`} className="text-sm font-medium">
            Email address
          </label>
          <Input
            id={`${portalRole}-email`}
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...register('email')}
            aria-describedby={errors.email ? `${portalRole}-email-error` : undefined}
          />
          {errors.email && (
            <p id={`${portalRole}-email-error`} className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor={`${portalRole}-password`} className="text-sm font-medium">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id={`${portalRole}-password`}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              aria-describedby={errors.password ? `${portalRole}-password-error` : undefined}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id={`${portalRole}-password-error`} className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
          id={`${portalRole}-submit-btn`}
        >
          {isSubmitting ? 'Verifying access…' : `Sign in to ${config.title}`}
        </Button>
      </form>

      {/* ── Switch Portal Links ── */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground mb-2">Switch Login Portal:</p>
        <div className="grid grid-cols-2 gap-2">
          {portalRole !== 'admin' && (
            <Link
              to="/admin-login"
              className="text-xs p-2 rounded-md bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 text-center transition-colors"
            >
              🛡️ Admin Portal
            </Link>
          )}
          {portalRole !== 'inbound_sales' && (
            <Link
              to="/inbound-sales-login"
              className="text-xs p-2 rounded-md bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 text-center transition-colors"
            >
              📞 Sales Portal
            </Link>
          )}
          {portalRole !== 'field_agent' && (
            <Link
              to="/field-agent-login"
              className="text-xs p-2 rounded-md bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 text-center transition-colors"
            >
              👷 Field Agent Portal
            </Link>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Need account assistance?{' '}
        <span className="text-foreground">Contact your system administrator.</span>
      </p>
    </div>
  );
}
