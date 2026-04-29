import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopNavbar } from './TopNavbar';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="app-shell min-h-screen flex w-full max-w-full overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavbar />
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
