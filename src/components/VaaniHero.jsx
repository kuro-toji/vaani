import { useEffect, useState } from 'react';

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: `${Math.random() * 4 + 2}px`,
  delay: `${Math.random() * 8}s`,
  duration: `${Math.random() * 6 + 8}s`,
  opacity: Math.random() * 0.6 + 0.2,
}));

export default function VaaniHero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      style={{
        minHeight: '100dvh',
        background: 'radial-gradient(ellipse at center, #0A4D4A 0%, #061A1A 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Noto Sans Devanagari", sans-serif',
        padding: '0 24px',
      }}
    >
      {/* Floating saffron particles */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <style>{`
          @keyframes floatUp {
            0%   { transform: translateY(110vh) scale(0); opacity: 0; }
            10%  { opacity: 1; }
            90%  { opacity: 0.6; }
            100% { transform: translateY(-10vh) scale(1); opacity: 0; }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 480px) {
            .hero-logo { font-size: 36px !important; }
            .hero-btns  { flex-direction: column !important; align-items: stretch !important; }
            .hero-btns  > button { width: 100% !important; }
          }
        `}</style>

        {PARTICLES.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              bottom: 0,
              left: p.left,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: '#FF6B00',
              opacity: p.opacity,
              animation: `floatUp ${p.duration} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        }}
      >
        {/* Logo */}
        <div
          className="hero-logo"
          style={{
            fontSize: '52px',
            fontWeight: 800,
            color: '#FF6B00',
            letterSpacing: '-1px',
            lineHeight: 1,
            fontFamily: '"Noto Sans Devanagari", sans-serif',
            animation: 'fadeUp 0.6s ease-out both',
          }}
        >
          VAANI
        </div>

        {/* Hindi tagline */}
        <p
          style={{
            fontSize: '20px',
            color: 'rgba(255,255,255,0.75)',
            margin: '12px 0 0',
            textAlign: 'center',
            fontFamily: '"Noto Sans Devanagari", sans-serif',
            animation: 'fadeUp 0.6s ease-out 0.1s both',
          }}
        >
          गाँव का साथी, पैसे का हाथी
        </p>

        {/* English sub */}
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.45)',
            margin: '8px 0 0',
            textAlign: 'center',
            maxWidth: '400px',
            lineHeight: 1.5,
            animation: 'fadeUp 0.6s ease-out 0.2s both',
          }}
        >
          AI-powered vernacular finance advisor for 500M rural Indians
        </p>

        {/* Buttons */}
        <div
          className="hero-btns"
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '32px',
            animation: 'fadeUp 0.6s ease-out 0.3s both',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <button
            style={{
              height: '52px',
              padding: '0 32px',
              background: '#FF6B00',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 700,
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: '"Noto Sans Devanagari", sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            APK Download करें
          </button>
          <button
            style={{
              height: '52px',
              padding: '0 32px',
              background: 'transparent',
              color: '#FF6B00',
              fontSize: '18px',
              fontWeight: 600,
              borderRadius: '12px',
              border: '1.5px solid #FF6B00',
              cursor: 'pointer',
              fontFamily: '"Noto Sans Devanagari", sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            Live Demo देखें
          </button>
        </div>

        {/* Trust row */}
        <p
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.4)',
            marginTop: '20px',
            textAlign: 'center',
            letterSpacing: '0.3px',
            animation: 'fadeUp 0.6s ease-out 0.4s both',
          }}
        >
          ★ 4.8&nbsp; | &nbsp;28 states&nbsp; | &nbsp;122 languages&nbsp; | &nbsp;₹10K se shuru
        </p>
      </div>
    </section>
  );
}