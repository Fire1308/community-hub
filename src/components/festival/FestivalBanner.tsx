import { useActiveFestival } from '@/hooks/useFestivalSettings';

const defaultBackgrounds: Record<string, string> = {
  christmas: 'linear-gradient(135deg, hsl(var(--background)), hsl(355 70% 15% / 0.3))',
  'new-year': 'linear-gradient(135deg, hsl(var(--background)), hsl(260 50% 20% / 0.3))',
  halloween: 'linear-gradient(135deg, hsl(var(--background)), hsl(270 50% 10% / 0.5))',
  thingyan: 'linear-gradient(135deg, hsl(var(--background)), hsl(190 60% 25% / 0.3))',
  thadingyut: 'linear-gradient(135deg, hsl(var(--background)), hsl(40 60% 20% / 0.3))',
  tazaungdaing: 'linear-gradient(135deg, hsl(var(--background)), hsl(30 60% 15% / 0.3))',
};

export function FestivalBanner() {
  const { data: activeFestival, isLoading } = useActiveFestival();

  if (isLoading || !activeFestival) return null;

  const festivalId = activeFestival.festival_id;
  const background = activeFestival.background_gradient || defaultBackgrounds[festivalId] || '';

  return (
    <div
      className="relative overflow-hidden border-b border-border"
      style={{ background }}
    >
      {/* Animated elements based on festival */}
      {festivalId === 'christmas' && <SnowfallEffect emojis={activeFestival.custom_emojis} />}
      {festivalId === 'new-year' && <FireworksEffect emojis={activeFestival.custom_emojis} />}
      {festivalId === 'halloween' && <GhostEffect emojis={activeFestival.custom_emojis} />}
      {festivalId === 'thingyan' && <WaterSplashEffect emojis={activeFestival.custom_emojis} />}
      {festivalId === 'thadingyut' && <LanternEffect emojis={activeFestival.custom_emojis} />}
      {festivalId === 'tazaungdaing' && <BalloonEffect emojis={activeFestival.custom_emojis} />}

      <div className="container py-6 text-center relative z-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{activeFestival.title}</h2>
        <p className="text-muted-foreground">{activeFestival.subtitle}</p>
        {activeFestival.wish_text && (
          <p className="mt-2 text-lg font-medium text-primary">{activeFestival.wish_text}</p>
        )}
      </div>
    </div>
  );
}

function SnowfallEffect({ emojis }: { emojis?: string[] | null }) {
  const defaultEmojis = ['❄️', '❄️', '❄️', '⛄'];
  const emojiList = emojis?.length ? emojis : defaultEmojis;
  
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
          {emojiList[i % emojiList.length]}
        </div>
      ))}
    </div>
  );
}

function FireworksEffect({ emojis }: { emojis?: string[] | null }) {
  const defaultEmojis = ['✨', '🎇', '🎆', '⭐'];
  const emojiList = emojis?.length ? emojis : defaultEmojis;
  
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
          {emojiList[i % emojiList.length]}
        </div>
      ))}
    </div>
  );
}

function GhostEffect({ emojis }: { emojis?: string[] | null }) {
  const defaultEmojis = ['👻', '🎃', '🦇', '🕷️'];
  const emojiList = emojis?.length ? emojis : defaultEmojis;
  
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
          {emojiList[i % emojiList.length]}
        </div>
      ))}
    </div>
  );
}

function WaterSplashEffect({ emojis }: { emojis?: string[] | null }) {
  const defaultEmojis = ['💧', '💦', '🌊', '🌸'];
  const emojiList = emojis?.length ? emojis : defaultEmojis;
  
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
          {emojiList[i % emojiList.length]}
        </div>
      ))}
    </div>
  );
}

function LanternEffect({ emojis }: { emojis?: string[] | null }) {
  const defaultEmojis = ['🪔', '✨', '🕯️', '💡'];
  const emojiList = emojis?.length ? emojis : defaultEmojis;
  
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
          {emojiList[i % emojiList.length]}
        </div>
      ))}
    </div>
  );
}

function BalloonEffect({ emojis }: { emojis?: string[] | null }) {
  const defaultEmojis = ['🎈', '🎊', '🔥', '🎉'];
  const emojiList = emojis?.length ? emojis : defaultEmojis;
  
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
          {emojiList[i % emojiList.length]}
        </div>
      ))}
    </div>
  );
}
