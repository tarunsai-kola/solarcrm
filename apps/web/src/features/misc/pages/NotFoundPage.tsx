import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-6 animate-fade-in">
        <p className="text-8xl font-black gradient-text">404</p>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button asChild id="not-found-home-btn">
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
