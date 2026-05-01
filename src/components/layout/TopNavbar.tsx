import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function TopNavbar() {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-3 sm:px-4 bg-card gap-2">
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <SidebarTrigger />
        <Link to="/" aria-label="Back to Home">
          <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-3 gap-1.5 text-muted-foreground hover:text-foreground">
            <Home className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline text-xs sm:text-sm">Back to Home</span>
          </Button>
        </Link>
        <h2 className="text-sm font-medium text-muted-foreground hidden md:block truncate">
          Gym Management
        </h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="text-muted-foreground h-9 w-9">
          <Bell className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
            RS
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
