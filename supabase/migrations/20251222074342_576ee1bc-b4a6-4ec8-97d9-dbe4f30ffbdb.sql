-- Create update_updated_at function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create festival settings table for admin customization
CREATE TABLE public.festival_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  festival_id TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  wish_text TEXT,
  background_gradient TEXT,
  is_active BOOLEAN DEFAULT false,
  custom_emojis TEXT[],
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.festival_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read festival settings
CREATE POLICY "Anyone can view festival settings" 
ON public.festival_settings FOR SELECT USING (true);

-- Only admins can modify using is_admin_or_mod function
CREATE POLICY "Admins can manage festival settings" 
ON public.festival_settings FOR ALL 
USING (public.is_admin_or_mod(auth.uid()))
WITH CHECK (public.is_admin_or_mod(auth.uid()));

-- Insert default festival data
INSERT INTO public.festival_settings (festival_id, title, subtitle, wish_text, background_gradient, custom_emojis) VALUES
('christmas', 'Merry Christmas', 'Wishing you joy and happiness', 'Season of Sharing & Love', 'linear-gradient(135deg, #1a472a 0%, #2d5a3f 50%, #8b0000 100%)', ARRAY['🎄', '🎅', '❄️', '🎁']),
('new-year', 'Happy New Year', 'Welcome to a new beginning', 'Cheers to new beginnings!', 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', ARRAY['🎆', '🎉', '✨', '🥂']),
('halloween', 'Happy Halloween', 'Spooky season is here', 'Trick or Treat!', 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #ff6600 100%)', ARRAY['🎃', '👻', '🦇', '🕷️']),
('thingyan', 'သင်္ကြန်မင်္ဂလာပါ', 'မြန်မာနှစ်သစ်ကို ကြိုဆိုပါသည်', 'နှစ်သစ်မှာ ကံကောင်းပါစေ၊ စိတ်ချမ်းသာ ကိုယ်ကျန်းမာပါစေ', 'linear-gradient(135deg, #00b4d8 0%, #0077b6 50%, #90e0ef 100%)', ARRAY['💧', '🌸', '🎊', '🌺']),
('thadingyut', 'သီတင်းကျွတ် မင်္ဂလာပါ', 'အလင်းရောင်ပွဲတော်', 'မင်္ဂလာအပါင်းနှင့် ပြည့်စုံပါစေ', 'linear-gradient(135deg, #ff9500 0%, #ff7300 50%, #ffd000 100%)', ARRAY['🪔', '✨', '🌟', '🕯️']),
('tazaungdaing', 'တန်ဆောင်တိုင် မင်္ဂလာပါ', 'မီးပုံးပျံပွဲတော်', 'ပျော်ရွှင်ဖွယ်ရာ ပွဲတော်ဖြစ်ပါစေ', 'linear-gradient(135deg, #1a1a2e 0%, #ff6b35 50%, #ffd700 100%)', ARRAY['🎈', '🎆', '🌙', '🔥']);

-- Create trigger for updated_at
CREATE TRIGGER update_festival_settings_updated_at
BEFORE UPDATE ON public.festival_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();