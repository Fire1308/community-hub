import { useState } from 'react';
import { Check, Palette, PartyPopper, Grid3X3, Sparkles, Save, Loader2, LayoutGrid } from 'lucide-react';
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
import { useUpdateSystemSetting, useSystemSettings } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { forumLayouts, ForumLayout } from '@/types/forum-layouts';

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
  const { data: settings } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  const queryClient = useQueryClient();

  const currentLayout = (settings?.forum_layout as ForumLayout) || 'social-timeline';
  
  const [selectedForumTheme, setSelectedForumTheme] = useState<ForumTheme>(forumTheme);
  const [selectedFestivalTheme, setSelectedFestivalTheme] = useState<FestivalTheme>(festivalTheme);
  const [selectedLayout, setSelectedLayout] = useState<ForumLayout>(currentLayout);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = role === 'admin' || role === 'moderator';

  // Only show for admins
  if (!isAdmin) return null;

  const hasChanges = 
    selectedForumTheme !== forumTheme || 
    selectedFestivalTheme !== festivalTheme ||
    selectedLayout !== currentLayout;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (selectedForumTheme !== forumTheme) {
        await updateSetting.mutateAsync({ key: 'forum_theme', value: selectedForumTheme });
      }
      if (selectedFestivalTheme !== festivalTheme) {
        await updateSetting.mutateAsync({ key: 'festival_theme', value: selectedFestivalTheme });
      }
      if (selectedLayout !== currentLayout) {
        await updateSetting.mutateAsync({ key: 'forum_layout', value: selectedLayout });
      }
      
      queryClient.invalidateQueries({ queryKey: ['global-theme-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      
      toast({
        title: 'Settings Saved',
        description: 'Global appearance has been updated for all users.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg hover:scale-105 transition-transform bg-background">
          <Palette className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Admin Theme Settings
          </SheetTitle>
          <SheetDescription>
            Customize the forum appearance for all users
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="layout" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Style
            </TabsTrigger>
            <TabsTrigger value="festival" className="flex items-center gap-2">
              <PartyPopper className="h-4 w-4" />
              Festival
            </TabsTrigger>
          </TabsList>

          {/* Layout Tab */}
          <TabsContent value="layout" className="mt-4">
            <ScrollArea className="h-[55vh]">
              <div className="grid gap-3 pr-4">
                {forumLayouts.map((layout) => (
                  <Card
                    key={layout.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedLayout === layout.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedLayout(layout.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                          {layout.emoji}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{layout.name}</p>
                            {currentLayout === layout.id && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Active</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{layout.description}</p>
                        </div>
                        {selectedLayout === layout.id && <Check className="h-5 w-5 text-primary" />}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="mt-4">
            <ScrollArea className="h-[55vh]">
              <div className="space-y-6 pr-4">
                {Object.entries(themeCategories).map(([category, themeIds]) => (
                  <div key={category}>
                    <h3 className="text-sm font-medium mb-3 capitalize">{category} Themes</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {forumThemes.filter(t => themeIds.includes(t.id)).map((theme) => (
                        <Card
                          key={theme.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedForumTheme === theme.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedForumTheme(theme.id)}
                        >
                          <CardContent className="p-3">
                            <div className="h-12 rounded-md mb-2" style={{ background: theme.preview.replace('bg-', '') }} />
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{theme.name}</span>
                              {forumTheme === theme.id && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Active</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Festival Tab */}
          <TabsContent value="festival" className="mt-4">
            <ScrollArea className="h-[55vh]">
              <div className="space-y-6 pr-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">🌍 Global</h3>
                  <div className="grid gap-3">
                    {festivalThemes.filter(f => ['none', 'christmas', 'new-year', 'halloween'].includes(f.id)).map((festival) => (
                      <Card
                        key={festival.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedFestivalTheme === festival.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedFestivalTheme(festival.id)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <span className="text-2xl">{festival.emoji}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{festival.name}</p>
                              {festivalTheme === festival.id && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Active</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{festival.description}</p>
                          </div>
                          {selectedFestivalTheme === festival.id && <Check className="h-5 w-5 text-primary" />}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">🇲🇲 Myanmar</h3>
                  <div className="grid gap-3">
                    {festivalThemes.filter(f => ['thingyan', 'thadingyut', 'tazaungdaing'].includes(f.id)).map((festival) => (
                      <Card
                        key={festival.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedFestivalTheme === festival.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedFestivalTheme(festival.id)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <span className="text-2xl">{festival.emoji}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{festival.name}</p>
                              {festival.nameMM && <span className="text-xs text-muted-foreground">({festival.nameMM})</span>}
                              {festivalTheme === festival.id && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Active</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{festival.description}</p>
                          </div>
                          {selectedFestivalTheme === festival.id && <Check className="h-5 w-5 text-primary" />}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {hasChanges && (
          <div className="mt-4 pt-4 border-t">
            <Button onClick={handleSave} className="w-full" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Global Settings
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Changes will apply to all users
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
