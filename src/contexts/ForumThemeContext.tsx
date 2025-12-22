import React, { createContext, useContext, useState, useEffect } from 'react';

export type ForumTheme = 
  | 'default'
  | 'minimal-editorial'
  | 'dark-glass'
  | 'neon-cyberpunk'
  | 'soft-pastel'
  | 'terminal'
  | 'social-feed'
  | 'knowledge-base'
  | 'luxury-premium'
  | 'gen-z'
  | 'corporate'
  | 'magazine'
  | 'retro-pixel'
  | 'nature-calm'
  | 'power-user'
  | 'motion-driven';

export type FestivalTheme = 
  | 'none'
  | 'christmas'
  | 'new-year'
  | 'halloween'
  | 'thingyan'
  | 'thadingyut'
  | 'tazaungdaing';

interface ForumThemeContextType {
  forumTheme: ForumTheme;
  setForumTheme: (theme: ForumTheme) => void;
  festivalTheme: FestivalTheme;
  setFestivalTheme: (theme: FestivalTheme) => void;
}

const ForumThemeContext = createContext<ForumThemeContextType | undefined>(undefined);

export const forumThemes: { id: ForumTheme; name: string; description: string }[] = [
  { id: 'default', name: 'Default', description: 'Clean modern forum design' },
  { id: 'minimal-editorial', name: 'Minimal Editorial', description: 'White space, typography focused' },
  { id: 'dark-glass', name: 'Dark Glassmorphism', description: 'Frosted glass, premium SaaS vibe' },
  { id: 'neon-cyberpunk', name: 'Neon Cyberpunk', description: 'Neon gradients, gamer community' },
  { id: 'soft-pastel', name: 'Soft Pastel', description: 'Friendly, casual community' },
  { id: 'terminal', name: 'Developer Terminal', description: 'Monospace, CLI accent' },
  { id: 'social-feed', name: 'Social Feed', description: 'Facebook/Reddit style' },
  { id: 'knowledge-base', name: 'Knowledge Base', description: 'StackOverflow-like Q&A' },
  { id: 'luxury-premium', name: 'Luxury Premium', description: 'Dark + gold accents' },
  { id: 'gen-z', name: 'Youth / Gen-Z', description: 'Bold, expressive, fun' },
  { id: 'corporate', name: 'Corporate Professional', description: 'Formal, enterprise forum' },
  { id: 'magazine', name: 'Magazine / News', description: 'Grid-based, headlines-first' },
  { id: 'retro-pixel', name: 'Retro Pixel', description: 'Nostalgic, indie gaming' },
  { id: 'nature-calm', name: 'Nature / Calm', description: 'Green tones, wellness' },
  { id: 'power-user', name: 'Power User Dense', description: 'Compact, keyboard shortcuts' },
  { id: 'motion-driven', name: 'Motion Driven', description: 'Scroll animations, unique transitions' },
];

export const festivalThemes: { id: FestivalTheme; name: string; description: string; emoji: string }[] = [
  { id: 'none', name: 'None', description: 'No seasonal theme', emoji: '🎭' },
  { id: 'christmas', name: 'Christmas', description: 'Snowfall, warm lights', emoji: '🎄' },
  { id: 'new-year', name: 'New Year', description: 'Fireworks, celebration', emoji: '🎆' },
  { id: 'halloween', name: 'Halloween', description: 'Spooky vibes', emoji: '🎃' },
  { id: 'thingyan', name: 'Thingyan (သင်္ကြန်)', description: 'Water festival, Myanmar New Year', emoji: '💧' },
  { id: 'thadingyut', name: 'Thadingyut', description: 'Festival of lights', emoji: '🪔' },
  { id: 'tazaungdaing', name: 'Tazaungdaing', description: 'Hot air balloons', emoji: '🎈' },
];

export function ForumThemeProvider({ children }: { children: React.ReactNode }) {
  const [forumTheme, setForumThemeState] = useState<ForumTheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('forum-style-theme') as ForumTheme) || 'default';
    }
    return 'default';
  });

  const [festivalTheme, setFestivalThemeState] = useState<FestivalTheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('forum-festival-theme') as FestivalTheme) || 'none';
    }
    return 'none';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    forumThemes.forEach(t => root.classList.remove(`theme-${t.id}`));
    festivalThemes.forEach(t => root.classList.remove(`festival-${t.id}`));
    
    // Add current themes
    if (forumTheme !== 'default') {
      root.classList.add(`theme-${forumTheme}`);
    }
    if (festivalTheme !== 'none') {
      root.classList.add(`festival-${festivalTheme}`);
    }
    
    localStorage.setItem('forum-style-theme', forumTheme);
    localStorage.setItem('forum-festival-theme', festivalTheme);
  }, [forumTheme, festivalTheme]);

  const setForumTheme = (theme: ForumTheme) => setForumThemeState(theme);
  const setFestivalTheme = (theme: FestivalTheme) => setFestivalThemeState(theme);

  return (
    <ForumThemeContext.Provider value={{ forumTheme, setForumTheme, festivalTheme, setFestivalTheme }}>
      {children}
    </ForumThemeContext.Provider>
  );
}

export function useForumTheme() {
  const context = useContext(ForumThemeContext);
  if (context === undefined) {
    throw new Error('useForumTheme must be used within a ForumThemeProvider');
  }
  return context;
}
