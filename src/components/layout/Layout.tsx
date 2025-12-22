import { ReactNode } from 'react';
import { Header } from './Header';
import { AppSidebar } from './AppSidebar';
import { FestivalBanner } from '@/components/festival/FestivalBanner';
import { GlobalChat } from '@/components/chat/GlobalChat';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = false }: LayoutProps) {
  const { user } = useAuth();

  // If not logged in, render without sidebar
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <FestivalBanner />
        <main className="flex-1">
          {children}
        </main>
        <GlobalChat />
        <ThemeSwitcher />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <FestivalBanner />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
      <GlobalChat />
      <ThemeSwitcher />
    </SidebarProvider>
  );
}
