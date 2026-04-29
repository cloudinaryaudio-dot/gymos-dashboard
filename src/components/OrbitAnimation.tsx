import personImg from '@/assets/orbit-person.png';
import iconDumbbell from '@/assets/orbit-icon-dumbbell.png';
import iconMeditation from '@/assets/orbit-icon-meditation.png';
import iconDance from '@/assets/orbit-icon-dance.png';
import iconFood from '@/assets/orbit-icon-food.png';
import iconHeart from '@/assets/orbit-icon-heart.png';

export interface OrbitIcon { src: string; alt: string; }

interface OrbitAnimationProps {
  speed?: 'slow' | 'normal' | 'fast';
  pauseOnHover?: boolean;
  personUrl?: string;
  icons?: OrbitIcon[];
}

const SPEED_MAP = { slow: 18, normal: 12, fast: 8 };

const DEFAULT_ICONS: OrbitIcon[] = [
  { src: iconDumbbell, alt: 'Strength Training' },
  { src: iconMeditation, alt: 'Meditation' },
  { src: iconDance, alt: 'Dance Fitness' },
  { src: iconFood, alt: 'Nutrition' },
  { src: iconHeart, alt: 'Cardio Health' },
];

export default function OrbitAnimation({ speed = 'normal', pauseOnHover = true, personUrl, icons: customIcons }: OrbitAnimationProps) {
  const duration = SPEED_MAP[speed];
  const hoverClass = pauseOnHover ? 'hover:[animation-play-state:paused]' : '';
  const centerImg = personUrl || personImg;
  const icons = customIcons?.length ? customIcons : DEFAULT_ICONS;

  return (
    <div className="orbit-anim-wrap relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] md:w-[460px] md:h-[460px] mx-auto max-w-full">
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-[60px] animate-[glow-pulse_4s_ease-in-out_infinite]" />

      {/* Orbit track */}
      <div className="absolute inset-[8%] rounded-full border border-primary/10" />

      {/* Center person */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="relative animate-[breathe_4s_ease-in-out_infinite]">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-[30px] scale-110" />
          <img
            src={centerImg}
            alt="Fitness Person"
            className="relative w-[120px] h-[120px] md:w-[180px] md:h-[180px] object-contain drop-shadow-2xl"
            width={512}
            height={512}
          />
        </div>
      </div>

      {/* Orbiting icons */}
      <div
        className={`absolute inset-0 ${hoverClass}`}
        style={{ animation: `orbit ${duration}s linear infinite` }}
      >
        {icons.map((icon, i) => {
          const angle = (360 / icons.length) * i;
          return (
            <div
              key={icon.alt}
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `rotate(${angle}deg) translateX(300%) rotate(-${angle}deg)`,
                marginLeft: '-22px',
                marginTop: '-22px',
              }}
            >
              {/* Counter-rotate to stay upright */}
              <div
                style={{ animation: `counter-orbit ${duration}s linear infinite` }}
                className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] rounded-xl bg-[hsl(220,25%,8%)] border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10 transition-transform duration-300 hover:scale-110"
              >
                <img
                  src={icon.src}
                  alt={icon.alt}
                  className="w-[26px] h-[26px] md:w-[32px] md:h-[32px] object-contain"
                  loading="lazy"
                  width={512}
                  height={512}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
