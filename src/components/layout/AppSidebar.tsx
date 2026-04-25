import {
  LayoutDashboard, Users, CreditCard, UserPlus, Receipt, Globe, Settings, Dumbbell, Package, MessageCircle, Sparkles, BarChart3, FileText,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';
import { useGymSettings } from '@/hooks/useGymSettings';

const navItems = [
  { title: 'Dashboard', url: '/app/dashboard', icon: LayoutDashboard },
  { title: 'Owner Summary', url: '/app/owner-summary', icon: Sparkles },
  { title: 'Analytics', url: '/app/analytics', icon: BarChart3 },
  { title: 'Members', url: '/app/members', icon: Users },
  { title: 'Plans', url: '/app/plans', icon: Package },
  { title: 'Payments', url: '/app/payments', icon: CreditCard },
  { title: 'Leads', url: '/app/leads', icon: UserPlus },
  { title: 'Expenses', url: '/app/expenses', icon: Receipt },
  { title: 'Website', url: '/app/website', icon: Globe },
  { title: 'Contact', url: '/app/contact', icon: MessageCircle },
  { title: 'Settings', url: '/app/settings', icon: Settings },
  { title: 'Invoice Template', url: '/app/settings/invoice', icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { resolved } = useGymSettings();

  return (
    <Sidebar collapsible="icon">
      <div className="p-4 flex items-center gap-3">
        {resolved.logo_url ? (
          <img src={resolved.logo_url} alt={resolved.gym_name} className="h-9 w-9 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
        {!collapsed && (
          <span className="text-lg font-bold font-display text-sidebar-accent-foreground">{resolved.gym_name}</span>
        )}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/app/dashboard'}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
