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

export const forumThemes: { id: ForumTheme; name: string; description: string; preview: string }[] = [
  { id: 'default', name: 'Default', description: 'Clean modern forum design', preview: 'bg-primary' },
  { id: 'minimal-editorial', name: 'Minimal Editorial', description: 'White space, typography focused', preview: 'bg-gradient-to-r from-gray-100 to-gray-200' },
  { id: 'dark-glass', name: 'Dark Glassmorphism', description: 'Frosted glass, premium SaaS vibe', preview: 'bg-gradient-to-r from-slate-800 to-slate-900' },
  { id: 'neon-cyberpunk', name: 'Neon Cyberpunk', description: 'Neon gradients, gamer community', preview: 'bg-gradient-to-r from-purple-600 to-pink-500' },
  { id: 'soft-pastel', name: 'Soft Pastel', description: 'Friendly, casual community', preview: 'bg-gradient-to-r from-pink-200 to-blue-200' },
  { id: 'terminal', name: 'Developer Terminal', description: 'Monospace, CLI accent', preview: 'bg-gradient-to-r from-green-900 to-black' },
  { id: 'social-feed', name: 'Social Feed', description: 'Facebook/Reddit style', preview: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  { id: 'knowledge-base', name: 'Knowledge Base', description: 'StackOverflow-like Q&A', preview: 'bg-gradient-to-r from-orange-400 to-orange-500' },
  { id: 'luxury-premium', name: 'Luxury Premium', description: 'Dark + gold accents', preview: 'bg-gradient-to-r from-yellow-600 to-yellow-800' },
  { id: 'gen-z', name: 'Youth / Gen-Z', description: 'Bold, expressive, fun', preview: 'bg-gradient-to-r from-fuchsia-500 to-cyan-500' },
  { id: 'corporate', name: 'Corporate Professional', description: 'Formal, enterprise forum', preview: 'bg-gradient-to-r from-blue-800 to-blue-900' },
  { id: 'magazine', name: 'Magazine / News', description: 'Grid-based, headlines-first', preview: 'bg-gradient-to-r from-red-600 to-red-700' },
  { id: 'retro-pixel', name: 'Retro Pixel', description: 'Nostalgic, indie gaming', preview: 'bg-gradient-to-r from-purple-800 to-indigo-900' },
  { id: 'nature-calm', name: 'Nature / Calm', description: 'Green tones, wellness', preview: 'bg-gradient-to-r from-green-500 to-emerald-600' },
  { id: 'power-user', name: 'Power User Dense', description: 'Compact, keyboard shortcuts', preview: 'bg-gradient-to-r from-gray-700 to-gray-800' },
  { id: 'motion-driven', name: 'Motion Driven', description: 'Scroll animations, unique transitions', preview: 'bg-gradient-to-r from-violet-500 to-purple-600' },
];

export const festivalThemes: { id: FestivalTheme; name: string; description: string; emoji: string; nameMM?: string }[] = [
  { id: 'none', name: 'None', description: 'No seasonal theme', emoji: '🎭' },
  { id: 'christmas', name: 'Christmas', description: 'Snowfall, warm lights', emoji: '🎄' },
  { id: 'new-year', name: 'New Year', description: 'Fireworks, celebration', emoji: '🎆' },
  { id: 'halloween', name: 'Halloween', description: 'Spooky vibes', emoji: '🎃' },
  { id: 'thingyan', name: 'Thingyan', nameMM: 'သင်္ကြန်', description: 'Water festival, Myanmar New Year', emoji: '💧' },
  { id: 'thadingyut', name: 'Thadingyut', nameMM: 'သီတင်းကျွတ်', description: 'Festival of lights', emoji: '🪔' },
  { id: 'tazaungdaing', name: 'Tazaungdaing', nameMM: 'တန်ဆောင်တိုင်', description: 'Hot air balloons', emoji: '🎈' },
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
