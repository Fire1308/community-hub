import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AppSidebar } from './AppSidebar';
import { FestivalBanner } from '@/components/festival/FestivalBanner';
import { GlobalChat } from '@/components/chat/GlobalChat';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <FestivalBanner />
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border md:hidden">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground">Menu</span>
          </div>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </div>
      <GlobalChat />
      <ThemeSwitcher />
    </SidebarProvider>
  );
}
