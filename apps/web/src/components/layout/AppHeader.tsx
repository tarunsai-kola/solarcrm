import { Bell, LogOut, Menu, PanelLeftClose, Settings, User } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';

import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { NotificationBellPopover } from '@/features/notifications/components/NotificationBellPopover';

interface AppHeaderProps {
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export function AppHeader({ onToggleSidebar, onOpenMobileSidebar }: AppHeaderProps) {
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="lg:hidden -ml-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop collapse button */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Toggle sidebar"
      >
        <PanelLeftClose className="h-4 w-4" />
      </button>

      {/* Page title area — consumer renders breadcrumbs via a portal or slot */}
      <div className="flex-1" />

      {/* ── Right side actions ── */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <NotificationBellPopover />

        {/* Profile dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors"
              aria-label="Open profile menu"
              id="header-profile-btn"
            >
              <Avatar.Root className="h-7 w-7 rounded-full">
                <Avatar.Image
                  src={profile?.avatar_url ?? undefined}
                  alt={profile?.full_name ?? 'User'}
                  className="h-full w-full rounded-full object-cover"
                />
                <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                  {getInitials(profile?.full_name ?? 'U')}
                </Avatar.Fallback>
              </Avatar.Root>
              <span className="hidden sm:block font-medium text-foreground max-w-[120px] truncate">
                {profile?.full_name ?? 'User'}
              </span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className={cn(
                'z-50 min-w-[180px] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
                'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
              )}
            >
              <div className="px-2 py-1.5 border-b border-border mb-1">
                <p className="text-xs font-semibold text-foreground">{profile?.full_name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {profile?.role?.replace('_', ' ')}
                </p>
              </div>

              <DropdownMenu.Item className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none">
                <User className="h-3.5 w-3.5" />
                Profile
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 border-t border-border" />

              <DropdownMenu.Item
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer outline-none"
                onSelect={() => void signOut()}
                id="header-signout-btn"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
