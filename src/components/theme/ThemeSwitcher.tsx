import { Check, Palette, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export function ThemeSwitcher() {
  const { forumTheme, setForumTheme, festivalTheme, setFestivalTheme } = useForumTheme();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg">
          <Palette className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Customize Theme</SheetTitle>
          <SheetDescription>Choose your forum style and seasonal decorations</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="style" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="style" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Forum Style
            </TabsTrigger>
            <TabsTrigger value="festival" className="flex items-center gap-2">
              <PartyPopper className="h-4 w-4" />
              Festival
            </TabsTrigger>
          </TabsList>

          <TabsContent value="style" className="mt-4">
            <ScrollArea className="h-[60vh]">
              <div className="grid gap-3 pr-4">
                {forumThemes.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    name={theme.name}
                    description={theme.description}
                    isSelected={forumTheme === theme.id}
                    onClick={() => setForumTheme(theme.id)}
                    preview={<ThemePreview theme={theme.id} />}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="festival" className="mt-4">
            <ScrollArea className="h-[60vh]">
              <div className="grid gap-3 pr-4">
                {festivalThemes.map((festival) => (
                  <ThemeCard
                    key={festival.id}
                    name={`${festival.emoji} ${festival.name}`}
                    description={festival.description}
                    isSelected={festivalTheme === festival.id}
                    onClick={() => setFestivalTheme(festival.id)}
                    preview={<FestivalPreview festival={festival.id} />}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function ThemeCard({
  name,
  description,
  isSelected,
  onClick,
  preview,
}: {
  name: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  preview: React.ReactNode;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-14 rounded-md overflow-hidden border flex-shrink-0">
            {preview}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{name}</CardTitle>
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </div>
            <CardDescription className="text-xs mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ThemePreview({ theme }: { theme: ForumTheme }) {
  const previewStyles: Record<ForumTheme, { bg: string; accent: string; text: string }> = {
    default: { bg: 'bg-background', accent: 'bg-primary', text: 'bg-foreground' },
    'minimal-editorial': { bg: 'bg-white', accent: 'bg-gray-900', text: 'bg-gray-400' },
    'dark-glass': { bg: 'bg-slate-900', accent: 'bg-blue-500/50', text: 'bg-white/20' },
    'neon-cyberpunk': { bg: 'bg-black', accent: 'bg-pink-500', text: 'bg-cyan-400' },
    'soft-pastel': { bg: 'bg-pink-50', accent: 'bg-pink-300', text: 'bg-purple-200' },
    terminal: { bg: 'bg-black', accent: 'bg-green-500', text: 'bg-green-700' },
    'social-feed': { bg: 'bg-gray-100', accent: 'bg-blue-600', text: 'bg-gray-300' },
    'knowledge-base': { bg: 'bg-white', accent: 'bg-orange-500', text: 'bg-gray-200' },
    'luxury-premium': { bg: 'bg-gray-900', accent: 'bg-yellow-500', text: 'bg-gray-700' },
    'gen-z': { bg: 'bg-purple-900', accent: 'bg-yellow-400', text: 'bg-pink-400' },
    corporate: { bg: 'bg-slate-100', accent: 'bg-blue-700', text: 'bg-slate-300' },
    magazine: { bg: 'bg-white', accent: 'bg-red-600', text: 'bg-gray-200' },
    'retro-pixel': { bg: 'bg-indigo-900', accent: 'bg-green-400', text: 'bg-purple-400' },
    'nature-calm': { bg: 'bg-green-50', accent: 'bg-green-600', text: 'bg-green-200' },
    'power-user': { bg: 'bg-gray-900', accent: 'bg-cyan-500', text: 'bg-gray-700' },
    'motion-driven': { bg: 'bg-violet-950', accent: 'bg-violet-500', text: 'bg-violet-700' },
  };

  const style = previewStyles[theme];

  return (
    <div className={`w-full h-full ${style.bg} p-1`}>
      <div className={`h-2 w-8 ${style.accent} rounded-sm mb-1`} />
      <div className={`h-1.5 w-12 ${style.text} rounded-sm mb-0.5`} />
      <div className={`h-1.5 w-10 ${style.text} rounded-sm`} />
    </div>
  );
}

function FestivalPreview({ festival }: { festival: FestivalTheme }) {
  const previewBg: Record<FestivalTheme, string> = {
    none: 'bg-background',
    christmas: 'bg-gradient-to-br from-green-900 to-red-900',
    'new-year': 'bg-gradient-to-br from-purple-900 to-blue-900',
    halloween: 'bg-gradient-to-br from-orange-900 to-purple-950',
    thingyan: 'bg-gradient-to-br from-cyan-700 to-blue-900',
    thadingyut: 'bg-gradient-to-br from-yellow-700 to-orange-900',
    tazaungdaing: 'bg-gradient-to-br from-orange-700 to-red-900',
  };

  const festivalEmojis: Record<FestivalTheme, string[]> = {
    none: [],
    christmas: ['🎄', '❄️', '🎁'],
    'new-year': ['🎆', '🎉', '✨'],
    halloween: ['🎃', '👻', '🦇'],
    thingyan: ['💧', '🌸', '💦'],
    thadingyut: ['🪔', '✨', '🕯️'],
    tazaungdaing: ['🎈', '🔥', '🎊'],
  };

  return (
    <div className={`w-full h-full ${previewBg[festival]} flex items-center justify-center gap-1`}>
      {festivalEmojis[festival].map((emoji, i) => (
        <span key={i} className="text-xs">{emoji}</span>
      ))}
    </div>
  );
}
