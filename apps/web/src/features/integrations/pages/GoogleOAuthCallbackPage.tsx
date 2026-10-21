import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { useExchangeGoogleCode } from '../hooks/use-integrations';

export function GoogleOAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exchangeMutation = useExchangeGoogleCode();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      setStatus('error');
      setErrorMessage(`Google authorization was declined: ${error}`);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Missing authorization code or state token from Google.');
      return;
    }

    const exchange = async () => {
      try {
        await exchangeMutation.mutateAsync({
          code,
          state,
          redirect_uri: window.location.origin + window.location.pathname,
        });
        setStatus('success');
        setTimeout(() => {
          navigate('/calendar');
        }, 2500);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(
          err.response?.data?.error?.message ||
            err.message ||
            'Failed to exchange authorization tokens with Google.',
        );
      }
    };

    exchange();
  }, [code, state, error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl text-center space-y-6">
        {status === 'processing' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tight">
              Connecting Google Calendar...
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Exchanging secure credentials and registering your Google Calendar for automatic phone reminders.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tight">
              Google Calendar Connected!
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your Google account is now fully linked. Meetings, client consultations, and site visits will automatically sync to your mobile Google Calendar app with alarm notifications.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/calendar')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors shadow-xs"
              >
                <Calendar className="h-4 w-4" /> Go to Calendar
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tight">
              Connection Failed
            </h2>
            <p className="text-xs text-destructive font-medium bg-destructive/5 p-3 rounded-xl border border-destructive/20">
              {errorMessage}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/integrations')}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors"
              >
                Back to Integrations
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
