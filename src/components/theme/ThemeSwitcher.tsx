import { useState } from 'react';
import { Check, Palette, PartyPopper, Grid3X3, Sparkles, Save, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForumTheme, forumThemes, festivalThemes, ForumTheme, FestivalTheme } from '@/contexts/ForumThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateSystemSetting } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const themeCategories = {
  minimal: ['default', 'minimal-editorial', 'nature-calm', 'corporate'],
  dark: ['dark-glass', 'neon-cyberpunk', 'terminal', 'luxury-premium', 'power-user', 'motion-driven'],
  colorful: ['soft-pastel', 'gen-z', 'retro-pixel'],
  content: ['social-feed', 'knowledge-base', 'magazine'],
};

export function ThemeSwitcher() {
  const { forumTheme, festivalTheme } = useForumTheme();
  const { role, user } = useAuth();
  const { toast } = useToast();
  const updateSetting = useUpdateSystemSetting();
  const queryClient = useQueryClient();
  
  const [selectedForumTheme, setSelectedForumTheme] = useState<ForumTheme>(forumTheme);
  const [selectedFestivalTheme, setSelectedFestivalTheme] = useState<FestivalTheme>(festivalTheme);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = role === 'admin' || role === 'moderator';
  const hasChanges = selectedForumTheme !== forumTheme || selectedFestivalTheme !== festivalTheme;

  const handleSave = async () => {
    if (!isAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only admins can save global theme settings.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (selectedForumTheme !== forumTheme) {
        await updateSetting.mutateAsync({ key: 'forum_theme', value: selectedForumTheme });
      }
      if (selectedFestivalTheme !== festivalTheme) {
        await updateSetting.mutateAsync({ key: 'festival_theme', value: selectedFestivalTheme });
      }
      
      // Invalidate to refresh theme across the app
      queryClient.invalidateQueries({ queryKey: ['global-theme-settings'] });
      
      toast({
        title: 'Theme Saved',
        description: 'Global theme has been updated for all users.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save theme',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg hover:scale-105 transition-transform">
          <Palette className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Theme Customizer
            {!isAdmin && (
              <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                View Only
              </span>
            )}
          </SheetTitle>
          <SheetDescription>
            {isAdmin 
              ? 'Customize the forum appearance for all users' 
              : 'Only admins can change global theme settings'}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="style" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="style" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Forum Style
            </TabsTrigger>
            <TabsTrigger value="festival" className="flex items-center gap-2">
              <PartyPopper className="h-4 w-4" />
              Festival Theme
            </TabsTrigger>
          </TabsList>

          <TabsContent value="style" className="mt-4">
            <ScrollArea className="h-[55vh]">
              <div className="space-y-6 pr-4">
                {/* Light/Minimal Themes */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-100 to-gray-200" />
                    Light & Minimal
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {forumThemes.filter(t => themeCategories.minimal.includes(t.id)).map((theme) => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isSelected={selectedForumTheme === theme.id}
                        isCurrent={forumTheme === theme.id}
                        onClick={() => isAdmin && setSelectedForumTheme(theme.id)}
                        disabled={!isAdmin}
                      />
                    ))}
                  </div>
                </div>

                {/* Dark Themes */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-700 to-slate-900" />
                    Dark & Premium
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {forumThemes.filter(t => themeCategories.dark.includes(t.id)).map((theme) => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isSelected={selectedForumTheme === theme.id}
                        isCurrent={forumTheme === theme.id}
                        onClick={() => isAdmin && setSelectedForumTheme(theme.id)}
                        disabled={!isAdmin}
                      />
                    ))}
                  </div>
                </div>

                {/* Colorful Themes */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-400 to-purple-400" />
                    Colorful & Fun
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {forumThemes.filter(t => themeCategories.colorful.includes(t.id)).map((theme) => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isSelected={selectedForumTheme === theme.id}
                        isCurrent={forumTheme === theme.id}
                        onClick={() => isAdmin && setSelectedForumTheme(theme.id)}
                        disabled={!isAdmin}
                      />
                    ))}
                  </div>
                </div>

                {/* Content-Focused Themes */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-orange-400" />
                    Content-Focused
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {forumThemes.filter(t => themeCategories.content.includes(t.id)).map((theme) => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isSelected={selectedForumTheme === theme.id}
                        isCurrent={forumTheme === theme.id}
                        onClick={() => isAdmin && setSelectedForumTheme(theme.id)}
                        disabled={!isAdmin}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="festival" className="mt-4">
            <ScrollArea className="h-[55vh]">
              <div className="space-y-6 pr-4">
                {/* Global Festivals */}
                <div>
                  <h3 className="text-sm font-medium mb-3">🌍 Global Celebrations</h3>
                  <div className="grid gap-3">
                    {festivalThemes.filter(f => ['none', 'christmas', 'new-year', 'halloween'].includes(f.id)).map((festival) => (
                      <FestivalCard
                        key={festival.id}
                        festival={festival}
                        isSelected={selectedFestivalTheme === festival.id}
                        isCurrent={festivalTheme === festival.id}
                        onClick={() => isAdmin && setSelectedFestivalTheme(festival.id)}
                        disabled={!isAdmin}
                      />
                    ))}
                  </div>
                </div>

                {/* Myanmar Festivals */}
                <div>
                  <h3 className="text-sm font-medium mb-3">🇲🇲 Myanmar Festivals</h3>
                  <div className="grid gap-3">
                    {festivalThemes.filter(f => ['thingyan', 'thadingyut', 'tazaungdaing'].includes(f.id)).map((festival) => (
                      <FestivalCard
                        key={festival.id}
                        festival={festival}
                        isSelected={selectedFestivalTheme === festival.id}
                        isCurrent={festivalTheme === festival.id}
                        onClick={() => isAdmin && setSelectedFestivalTheme(festival.id)}
                        disabled={!isAdmin}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Save Button - Only visible for admins with changes */}
        {isAdmin && hasChanges && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              onClick={handleSave} 
              className="w-full" 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Global Theme
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              This will apply the theme to all users
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ThemeCard({
  theme,
  isSelected,
  isCurrent,
  onClick,
  disabled,
}: {
  theme: { id: ForumTheme; name: string; description: string };
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Card
      className={`transition-all ${
        disabled ? 'cursor-default opacity-70' : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
      } ${isSelected ? 'ring-2 ring-primary shadow-md' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="h-16 rounded-md overflow-hidden border">
            <ThemePreview theme={theme.id} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium truncate">{theme.name}</span>
              {isCurrent && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Active</span>
              )}
            </div>
            {isSelected && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FestivalCard({
  festival,
  isSelected,
  isCurrent,
  onClick,
  disabled,
}: {
  festival: { id: FestivalTheme; name: string; description: string; emoji: string; nameMM?: string };
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Card
      className={`transition-all ${
        disabled ? 'cursor-default opacity-70' : 'cursor-pointer hover:shadow-md'
      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0">
            <FestivalPreview festival={festival.id} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{festival.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{festival.name}</p>
                    {isCurrent && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Active</span>
                    )}
                  </div>
                  {festival.nameMM && (
                    <p className="text-xs text-muted-foreground">{festival.nameMM}</p>
                  )}
                </div>
              </div>
              {isSelected && <Check className="h-5 w-5 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{festival.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ThemePreview({ theme }: { theme: ForumTheme }) {
  const previewStyles: Record<ForumTheme, { bg: string; card: string; accent: string; text: string }> = {
    default: { bg: 'bg-[hsl(209,40%,96%)]', card: 'bg-[hsl(210,40%,98%)]', accent: 'bg-[hsl(200,98%,39%)]', text: 'bg-[hsl(222,47%,11%)]' },
    'minimal-editorial': { bg: 'bg-white', card: 'bg-white', accent: 'bg-gray-900', text: 'bg-gray-400' },
    'dark-glass': { bg: 'bg-[hsl(222,47%,6%)]', card: 'bg-[hsl(220,30%,12%)]/70', accent: 'bg-[hsl(217,91%,60%)]', text: 'bg-white/30' },
    'neon-cyberpunk': { bg: 'bg-[hsl(270,50%,5%)]', card: 'bg-[hsl(270,50%,8%)]', accent: 'bg-[hsl(330,100%,60%)]', text: 'bg-[hsl(180,100%,50%)]' },
    'soft-pastel': { bg: 'bg-[hsl(340,80%,97%)]', card: 'bg-white', accent: 'bg-[hsl(340,80%,70%)]', text: 'bg-[hsl(280,70%,85%)]' },
    terminal: { bg: 'bg-[hsl(120,10%,5%)]', card: 'bg-[hsl(120,10%,8%)]', accent: 'bg-[hsl(120,100%,50%)]', text: 'bg-[hsl(120,50%,40%)]' },
    'social-feed': { bg: 'bg-[hsl(220,15%,95%)]', card: 'bg-white', accent: 'bg-[hsl(220,90%,55%)]', text: 'bg-gray-300' },
    'knowledge-base': { bg: 'bg-[hsl(0,0%,98%)]', card: 'bg-white', accent: 'bg-[hsl(27,98%,47%)]', text: 'bg-gray-200' },
    'luxury-premium': { bg: 'bg-[hsl(30,10%,8%)]', card: 'bg-[hsl(30,10%,12%)]', accent: 'bg-[hsl(45,100%,50%)]', text: 'bg-[hsl(40,20%,40%)]' },
    'gen-z': { bg: 'bg-[hsl(280,80%,8%)]', card: 'bg-[hsl(280,60%,15%)]', accent: 'bg-[hsl(60,100%,60%)]', text: 'bg-[hsl(330,100%,65%)]' },
    corporate: { bg: 'bg-[hsl(220,20%,97%)]', card: 'bg-white', accent: 'bg-[hsl(220,70%,45%)]', text: 'bg-[hsl(220,15%,75%)]' },
    magazine: { bg: 'bg-[hsl(0,0%,98%)]', card: 'bg-white', accent: 'bg-[hsl(0,85%,50%)]', text: 'bg-gray-300' },
    'retro-pixel': { bg: 'bg-[hsl(260,50%,12%)]', card: 'bg-[hsl(260,40%,18%)]', accent: 'bg-[hsl(120,100%,50%)]', text: 'bg-[hsl(280,80%,60%)]' },
    'nature-calm': { bg: 'bg-[hsl(120,30%,96%)]', card: 'bg-white', accent: 'bg-[hsl(140,60%,40%)]', text: 'bg-[hsl(120,30%,80%)]' },
    'power-user': { bg: 'bg-[hsl(220,20%,10%)]', card: 'bg-[hsl(220,20%,14%)]', accent: 'bg-[hsl(190,90%,50%)]', text: 'bg-[hsl(200,15%,45%)]' },
    'motion-driven': { bg: 'bg-[hsl(270,60%,6%)]', card: 'bg-[hsl(270,50%,12%)]', accent: 'bg-[hsl(270,90%,65%)]', text: 'bg-[hsl(300,80%,55%)]' },
  };

  const style = previewStyles[theme];

  return (
    <div className={`w-full h-full ${style.bg} p-2 flex flex-col gap-1`}>
      <div className="flex items-center gap-1">
        <div className={`h-1.5 w-6 ${style.accent} rounded-sm`} />
        <div className="flex-1" />
        <div className={`h-1.5 w-1.5 ${style.text} rounded-full opacity-50`} />
        <div className={`h-1.5 w-1.5 ${style.text} rounded-full opacity-50`} />
      </div>
      <div className="flex gap-1 flex-1">
        <div className={`w-4 ${style.card} rounded-sm p-0.5 space-y-0.5`}>
          <div className={`h-1 w-full ${style.text} rounded-sm opacity-30`} />
          <div className={`h-1 w-full ${style.accent} rounded-sm opacity-60`} />
          <div className={`h-1 w-full ${style.text} rounded-sm opacity-30`} />
        </div>
        <div className="flex-1 space-y-1">
          <div className={`h-5 ${style.card} rounded-sm p-1`}>
            <div className={`h-1 w-8 ${style.accent} rounded-sm`} />
            <div className={`h-1 w-10 ${style.text} rounded-sm mt-0.5 opacity-40`} />
          </div>
          <div className={`h-4 ${style.card} rounded-sm`} />
        </div>
      </div>
    </div>
  );
}

function FestivalPreview({ festival }: { festival: FestivalTheme }) {
  const previewConfig: Record<FestivalTheme, { bg: string; emojis: string[] }> = {
    none: { bg: 'bg-muted', emojis: [] },
    christmas: { bg: 'bg-gradient-to-br from-red-800 via-green-800 to-red-900', emojis: ['🎄', '❄️', '🎁', '⭐'] },
    'new-year': { bg: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900', emojis: ['🎆', '🎉', '✨', '🥂'] },
    halloween: { bg: 'bg-gradient-to-br from-orange-900 via-purple-950 to-black', emojis: ['🎃', '👻', '🦇', '🕷️'] },
    thingyan: { bg: 'bg-gradient-to-br from-cyan-500 via-blue-600 to-cyan-700', emojis: ['💧', '🌸', '💦', '🎊'] },
    thadingyut: { bg: 'bg-gradient-to-br from-yellow-600 via-orange-700 to-amber-800', emojis: ['🪔', '✨', '🕯️', '🙏'] },
    tazaungdaing: { bg: 'bg-gradient-to-br from-orange-600 via-red-700 to-orange-800', emojis: ['🎈', '🔥', '🎊', '🎉'] },
  };

  const config = previewConfig[festival];

  return (
    <div className={`w-full h-full ${config.bg} flex items-center justify-center p-2`}>
      <div className="grid grid-cols-2 gap-1">
        {config.emojis.map((emoji, i) => (
          <span key={i} className="text-base animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
