import { useState, forwardRef } from 'react';
import { useFestivalSettings, useUpdateFestivalSettings } from '@/hooks/useFestivalSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Save, Sparkles } from 'lucide-react';

export const FestivalCustomizer = forwardRef<HTMLDivElement>(function FestivalCustomizer(_, ref) {
  const { data: festivals, isLoading } = useFestivalSettings();
  const updateFestival = useUpdateFestivalSettings();
  const { toast } = useToast();
  const [selectedFestival, setSelectedFestival] = useState<string>('thingyan');
  const [formData, setFormData] = useState<Record<string, any>>({});

  const currentFestival = festivals?.find(f => f.festival_id === selectedFestival);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [selectedFestival]: {
        ...(prev[selectedFestival] || {}),
        [field]: value,
      },
    }));
  };

  const getValue = (field: string) => {
    return formData[selectedFestival]?.[field] ?? currentFestival?.[field as keyof typeof currentFestival] ?? '';
  };

  const handleSave = async () => {
    const updates = formData[selectedFestival];
    if (!updates) return;

    try {
      await updateFestival.mutateAsync({
        festivalId: selectedFestival,
        updates,
      });
      toast({
        title: 'Saved!',
        description: 'Festival settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading festivals...</div>;
  }

  const festivalEmojis: Record<string, string> = {
    christmas: '🎄',
    'new-year': '🎆',
    halloween: '🎃',
    thingyan: '💧',
    thadingyut: '🪔',
    tazaungdaing: '🎈',
  };

  return (
    <Card ref={ref}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Festival Customization
        </CardTitle>
        <CardDescription>
          Customize festival banners, text, and decorations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedFestival} onValueChange={setSelectedFestival}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6">
            {festivals?.map(festival => (
              <TabsTrigger key={festival.festival_id} value={festival.festival_id} className="text-xs">
                {festivalEmojis[festival.festival_id]} {festival.festival_id}
              </TabsTrigger>
            ))}
          </TabsList>

          {festivals?.map(festival => (
            <TabsContent key={festival.festival_id} value={festival.festival_id} className="space-y-4">
              {/* Preview Banner */}
              <div 
                className="p-6 rounded-lg text-center text-white relative overflow-hidden"
                style={{ background: getValue('background_gradient') || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                <h3 className="text-2xl font-bold mb-1">{getValue('title') || 'Festival Title'}</h3>
                <p className="text-sm opacity-90 mb-2">{getValue('subtitle') || 'Festival Subtitle'}</p>
                <p className="text-lg font-medium">{getValue('wish_text') || 'Festival Wish'}</p>
                <div className="mt-2 text-2xl">
                  {(getValue('custom_emojis') || ['🎉']).join(' ')}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-base">Activate Festival Theme</Label>
                  <p className="text-sm text-muted-foreground">Show this festival banner to all users</p>
                </div>
                <Switch
                  checked={getValue('is_active') || false}
                  onCheckedChange={(checked) => handleChange('is_active', checked)}
                />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={getValue('title') || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Festival title..."
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={getValue('subtitle') || ''}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  placeholder="Festival subtitle..."
                />
              </div>

              {/* Wish Text */}
              <div className="space-y-2">
                <Label>Wish Text (displayed on banner)</Label>
                <Textarea
                  value={getValue('wish_text') || ''}
                  onChange={(e) => handleChange('wish_text', e.target.value)}
                  placeholder="Festival wishes..."
                  rows={2}
                />
              </div>

              {/* Background Gradient */}
              <div className="space-y-2">
                <Label>Background Gradient (CSS)</Label>
                <Input
                  value={getValue('background_gradient') || ''}
                  onChange={(e) => handleChange('background_gradient', e.target.value)}
                  placeholder="linear-gradient(135deg, #color1 0%, #color2 100%)"
                />
              </div>

              {/* Custom Emojis */}
              <div className="space-y-2">
                <Label>Custom Emojis (comma separated)</Label>
                <Input
                  value={(getValue('custom_emojis') || []).join(', ')}
                  onChange={(e) => handleChange('custom_emojis', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="🎄, 🎅, ❄️, 🎁"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={getValue('start_date') || ''}
                    onChange={(e) => handleChange('start_date', e.target.value || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={getValue('end_date') || ''}
                    onChange={(e) => handleChange('end_date', e.target.value || null)}
                  />
                </div>
              </div>

              <Button onClick={handleSave} disabled={updateFestival.isPending} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {updateFestival.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
});

FestivalCustomizer.displayName = 'FestivalCustomizer';
