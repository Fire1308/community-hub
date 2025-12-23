import { ReactNode } from 'react';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { FestivalBanner } from '@/components/festival/FestivalBanner';
import { GlobalChat } from '@/components/chat/GlobalChat';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <FestivalBanner />
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
      <GlobalChat />
      <ThemeSwitcher />
    </div>
  );
}