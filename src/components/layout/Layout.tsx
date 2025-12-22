import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { FestivalBanner } from '@/components/festival/FestivalBanner';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <FestivalBanner />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
