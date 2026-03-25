import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Bell } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function TopNavbar() {
  const { user, signOut } = useAuth();
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">
          Gym Management
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Bell className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
