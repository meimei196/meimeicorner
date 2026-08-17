import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export function Particles() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobileCheck = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
    setIsMobile(mobileCheck);

    // Optimized particle counts to prevent GPU memory throttling during mobile screen recording
    const particleCount = mobileCheck ? 18 : 60;
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100 - 100,
        size: Math.random() * (mobileCheck ? 2 : 3) + 1.2,
        duration: Math.random() * 8 + 7,
        delay: Math.random() * -15,
      });
    }
    
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ transform: 'translateZ(0)' }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${
            isMobile ? 'bg-white/30' : 'bg-white/40 shadow-[0_0_6px_rgba(255,255,255,0.5)]'
          }`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `particleFall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
      <style>{`
        @keyframes particleFall {
          0% {
            transform: translateY(0vh) translateX(0vw) translateZ(0);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(120vh) translateX(3vw) translateZ(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
