import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, UserPlus, Receipt, Globe, Settings, Dumbbell, Package, MessageCircle, Sparkles, BarChart3, FileText, Trash2, RefreshCw, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';
import { useGymSettings } from '@/hooks/useGymSettings';
import { useDemoModeOptional } from '@/demo/DemoModeContext';
import { loadDemoDataset } from '@/demo/seedAdapter';
import { isOwnerLike, type Module } from '@/demo/permissions';

type NavItem = { title: string; url: string; icon: any; module?: Module; ownerOnly?: boolean };

const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/app/dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { title: 'Owner Summary', url: '/app/owner-summary', icon: Sparkles, ownerOnly: true },
  { title: 'Members', url: '/app/members', icon: Users, module: 'members' },
  { title: 'Plans', url: '/app/plans', icon: Package, module: 'plans' },
  { title: 'Payments', url: '/app/payments', icon: CreditCard, module: 'payments' },
  { title: 'Leads', url: '/app/leads', icon: UserPlus, module: 'leads' },
  { title: 'Expenses', url: '/app/expenses', icon: Receipt, module: 'expenses' },
  { title: 'Website', url: '/app/website', icon: Globe, module: 'website' },
  { title: 'Contact', url: '/app/contact', icon: MessageCircle, module: 'settings' },
  { title: 'Settings', url: '/app/settings', icon: Settings, module: 'settings' },
  { title: 'Invoice Template', url: '/app/settings/invoice', icon: FileText, module: 'settings' },
  { title: 'Recycle Bin', url: '/app/recycle', icon: Trash2, module: 'recycle' },
  { title: 'Employee Access', url: '/app/employee-access', icon: ShieldCheck, ownerOnly: true },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { resolved } = useGymSettings();
  const location = useLocation();
  const demo = useDemoModeOptional();
  const isDemo = demo?.isDemo ?? false;
  const ownerLike = !isDemo || isOwnerLike(demo?.currentUser ?? null);

  // Filter sidebar items by RBAC. Owner/non-demo always see everything.
  const visibleItems = useMemo(() => {
    return navItems.filter(item => {
      if (item.ownerOnly) return ownerLike;
      if (!isDemo) return true;
      if (ownerLike) return true;
      if (!item.module) return true;
      return demo?.can(item.module, 'view') ?? false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, ownerLike, demo?.changeTick, demo?.currentUser?.id]);

  // Auto-close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleResetDemo = () => {
    if (!demo) return;
    demo.exitDemo();
    // Re-seed fresh dataset and reset to default user
    setTimeout(() => {
      loadDemoDataset();
      toast.success('Demo reset — fresh dataset loaded');
    }, 0);
  };

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
              {visibleItems.map((item) => (
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
              {isDemo && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleResetDemo}
                    className="hover:bg-sidebar-accent/50 text-amber-600 dark:text-amber-400"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Reset Demo</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
