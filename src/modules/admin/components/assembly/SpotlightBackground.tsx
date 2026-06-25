import { m } from 'framer-motion';

const spotlights = [
  { x: ['5%', '75%', '15%', '85%', '5%'],  y: ['15%', '70%', '90%', '25%', '15%'], duration: 12, size: 700 },
  { x: ['80%', '10%', '90%', '20%', '80%'], y: ['5%',  '80%', '20%', '75%', '5%'],  duration: 14, size: 800 },
  { x: ['30%', '85%', '5%',  '70%', '30%'], y: ['70%', '10%', '50%', '90%', '70%'], duration: 16, size: 650 },
  { x: ['90%', '25%', '65%', '10%', '90%'], y: ['85%', '30%', '5%',  '60%', '85%'], duration: 13, size: 550 },
];

const SpotlightBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden bg-gradient-to-br from-[#0B4B39] to-[#071f18]">
    {spotlights.map((s, i) => (
      <m.div
        key={i}
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: s.size,
          height: s.size,
          background: 'radial-gradient(circle, rgba(255,220,120,0.18) 0%, rgba(255,220,120,0.07) 40%, transparent 70%)',
        }}
        animate={{ x: s.x, y: s.y }}
        transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut' }}
      />
    ))}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
      }}
    />
  </div>
);

export default SpotlightBackground;
