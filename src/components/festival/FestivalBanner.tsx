import { useForumTheme, FestivalTheme } from '@/contexts/ForumThemeContext';

const festivalMessages: Record<FestivalTheme, { title: string; subtitle: string; wish?: string }> = {
  none: { title: '', subtitle: '' },
  christmas: {
    title: '🎄 Merry Christmas!',
    subtitle: 'Wishing you joy and happiness this holiday season',
    wish: 'Season of Sharing & Joy',
  },
  'new-year': {
    title: '🎆 Happy New Year!',
    subtitle: 'Cheers to new beginnings and fresh starts',
    wish: 'May this year bring you success!',
  },
  halloween: {
    title: '🎃 Happy Halloween!',
    subtitle: 'Trick or treat! Have a spooky day',
    wish: 'Stay spooky! 👻',
  },
  thingyan: {
    title: '💧 သင်္ကြန်မင်္ဂလာပါ!',
    subtitle: 'နှစ်သစ်မှာ ကံကောင်းပါစေ',
    wish: 'စိတ်ချမ်းသာ ကိုယ်ကျန်းမာပါစေ 🙏',
  },
  thadingyut: {
    title: '🪔 သီတင်းကျွတ်မင်္ဂလာပါ',
    subtitle: 'အလင်းရောင်တွေနဲ့ ပျော်ရွှင်ဖွယ်ရာ ပွဲတော်ဖြစ်ပါစေ',
    wish: 'ဆရာသမားများကို ရှိခိုးကန်တော့ပါ 🙏',
  },
  tazaungdaing: {
    title: '🎈 တန်ဆောင်တိုင်မင်္ဂလာပါ',
    subtitle: 'ကောင်းကင်ယံမှ မီးပုံးလွှတ်ပွဲ',
    wish: 'သာယာဝပြောသော ပွဲတော်ဖြစ်ပါစေ 🎊',
  },
};

const festivalBackgrounds: Record<FestivalTheme, string> = {
  none: '',
  christmas: 'linear-gradient(135deg, hsl(var(--background)), hsl(355 70% 15% / 0.3))',
  'new-year': 'linear-gradient(135deg, hsl(var(--background)), hsl(260 50% 20% / 0.3))',
  halloween: 'linear-gradient(135deg, hsl(var(--background)), hsl(270 50% 10% / 0.5))',
  thingyan: 'linear-gradient(135deg, hsl(var(--background)), hsl(190 60% 25% / 0.3))',
  thadingyut: 'linear-gradient(135deg, hsl(var(--background)), hsl(40 60% 20% / 0.3))',
  tazaungdaing: 'linear-gradient(135deg, hsl(var(--background)), hsl(30 60% 15% / 0.3))',
};

export function FestivalBanner() {
  const { festivalTheme } = useForumTheme();

  if (festivalTheme === 'none') return null;

  const festival = festivalMessages[festivalTheme];

  return (
    <div
      className="relative overflow-hidden border-b border-border"
      style={{ background: festivalBackgrounds[festivalTheme] }}
    >
      {/* Animated elements based on festival */}
      {festivalTheme === 'christmas' && <SnowfallEffect />}
      {festivalTheme === 'new-year' && <FireworksEffect />}
      {festivalTheme === 'halloween' && <GhostEffect />}
      {festivalTheme === 'thingyan' && <WaterSplashEffect />}
      {festivalTheme === 'thadingyut' && <LanternEffect />}
      {festivalTheme === 'tazaungdaing' && <BalloonEffect />}

      <div className="container py-6 text-center relative z-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{festival.title}</h2>
        <p className="text-muted-foreground">{festival.subtitle}</p>
        {festival.wish && (
          <p className="mt-2 text-lg font-medium text-primary">{festival.wish}</p>
        )}
      </div>
    </div>
  );
}

function SnowfallEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute text-2xl animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          ❄️
        </div>
      ))}
    </div>
  );
}

function FireworksEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute text-3xl animate-pulse"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 60}%`,
            animationDelay: `${Math.random() * 1.5}s`,
          }}
        >
          {['✨', '🎇', '🎆', '⭐'][i % 4]}
        </div>
      ))}
    </div>
  );
}

function GhostEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute text-3xl animate-bounce opacity-50"
          style={{
            left: `${Math.random() * 90}%`,
            top: `${Math.random() * 80}%`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          {['👻', '🎃', '🦇', '🕷️'][i % 4]}
        </div>
      ))}
    </div>
  );
}

function WaterSplashEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute text-2xl animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 1.5}s`,
          }}
        >
          {['💧', '💦', '🌊', '🌸'][i % 4]}
        </div>
      ))}
    </div>
  );
}

function LanternEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute text-2xl animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          {['🪔', '✨', '🕯️', '💡'][i % 4]}
        </div>
      ))}
    </div>
  );
}

function BalloonEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute text-3xl animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        >
          {['🎈', '🎊', '🔥', '🎉'][i % 4]}
        </div>
      ))}
    </div>
  );
}
