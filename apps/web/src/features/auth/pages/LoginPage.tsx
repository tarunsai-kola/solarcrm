import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, ShieldCheck, UserCheck, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    try {
      await signIn(values.email, values.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      toast({ variant: 'destructive', title: 'Sign in failed', description: message });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Solar CRM Portals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select your designated role portal to access your workspace:
        </p>
      </div>

      {/* ── Role Portal Cards ── */}
      <div className="grid gap-3">
        <Link
          to="/admin-login"
          className="group flex items-center justify-between p-3.5 rounded-lg border border-border/70 bg-card hover:bg-accent/40 hover:border-amber-500/50 transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Administrator Portal
              </div>
              <div className="text-xs text-muted-foreground">
                Organization settings, team management & security
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          to="/inbound-sales-login"
          className="group flex items-center justify-between p-3.5 rounded-lg border border-border/70 bg-card hover:bg-accent/40 hover:border-primary/50 transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Inbound Sales Portal
              </div>
              <div className="text-xs text-muted-foreground">
                Leads pipeline, customer quotes & follow-ups
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          to="/field-agent-login"
          className="group flex items-center justify-between p-3.5 rounded-lg border border-border/70 bg-card hover:bg-accent/40 hover:border-emerald-500/50 transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Field Technical Agent Portal
              </div>
              <div className="text-xs text-muted-foreground">
                On-site surveys, roof suitability & bill audits
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or direct sign in</span>
        </div>
      </div>

      {/* ── Direct Unified Login Form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-sm font-medium">
            Email address
          </label>
          <Input
            id="login-email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...register('email')}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
          />
          {errors.email && (
            <p id="login-email-error" className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
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
            <p id="login-password-error" className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
          id="login-submit-btn"
        >
          {isSubmitting ? 'Authenticating…' : 'Sign in to Solar CRM'}
        </Button>
      </form>
    </div>
  );
}
