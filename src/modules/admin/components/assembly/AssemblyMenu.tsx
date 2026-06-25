import { m } from 'framer-motion';
import { X } from 'lucide-react';
import { useRouter, useNavigate } from '@tanstack/react-router';
type Slide = 'leaderboard' | 'top-scorers' | 'prize-draw' | 'challenge';

interface AssemblyMenuProps {
  onSelect: (slide: Slide) => void;
  isFullscreen?: boolean;
  schoolId?: string;
}

const cards = [
  {
    id: 'leaderboard' as Slide,
    title: 'HOUSE LEADERBOARD',
    subtitle: 'Top houses',
    icon: '/assembly/house-leaderboard-icon.svg',
  },
  {
    id: 'top-scorers' as Slide,
    title: 'TOP SCORERS BY HOUSE',
    subtitle: 'Shout out to top contributors',
    icon: '/assembly/top-score-by-houseicon.svg',
  },
  {
    id: 'prize-draw' as Slide,
    title: 'SPOT PRIZE DRAW',
    subtitle: 'Who will be the winner?',
    icon: '/assembly/spot-prize-draw-icon.svg',
  },
  {
    id: 'challenge' as Slide,
    title: 'YOUR NEXT CHALLENGE',
    subtitle: null,
    icon: '/assembly/this-week-challenge-Icon.svg',
  },
];

const AssemblyMenu = ({ onSelect, isFullscreen, schoolId }: AssemblyMenuProps) => {
  const router = useRouter();
  const navigate = useNavigate();
  const exitHref = schoolId ? `/admin/assembly?schoolId=${schoolId}` : '/admin/assembly';

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-12">
      {!isFullscreen && (
        <button
          onClick={() => navigate({ to: exitHref })}
          className="absolute right-6 top-6 rounded-full bg-white p-2 transition-colors hover:bg-white/90"
          style={{ color: '#357565' }}
        >
          <X className="h-6 w-6" />
        </button>
      )}

      <div className="mb-10 text-center">
        <div className="mb-3 flex items-center justify-center">
          <img src="/assembly/main-Logo.svg" alt="Karawhiua" width={160} height={92} priority />
        </div>
        <h1 className="text-3xl font-extrabold uppercase tracking-widest text-white">Assembly Update</h1>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-2 gap-5">
        {cards.map((card, i) => (
          <m.button
            key={card.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            onClick={() => onSelect(card.id)}
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10"
          >
            <img src={card.icon} alt="" width={56} height={56} className="opacity-80 group-hover:opacity-100 transition-opacity" />
            <div>
              <p className="text-lg font-extrabold uppercase tracking-wider text-white">{card.title}</p>
              {card.subtitle && <p className="mt-1 text-sm text-white/50">{card.subtitle}</p>}
            </div>
          </m.button>
        ))}
      </div>
    </div>
  );
};

export default AssemblyMenu;
