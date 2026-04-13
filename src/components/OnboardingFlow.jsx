import { useState, useRef, useEffect } from 'react';

/**
 * OnboardingFlow — 3-screen guided onboarding for first-time users.
 * Screens:
 *   1. Voice-first interaction
 *   2. 29 language support
 *   3. Accessibility preferences
 */
export default function OnboardingFlow({ onComplete }) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const containerRef = useRef(null);

  const screens = [
    {
      emoji: '🎙️',
      title: 'बोलिए, VAANI सुन रही है',
      titleEn: 'Speak, VAANI is listening',
      desc: 'टाइप करने की जरूरत नहीं। बस बोलिए — VAANI आपकी भाषा समझती है।',
      descEn: 'No typing needed. Just speak — VAANI understands your language.',
      gradient: 'linear-gradient(135deg, #0F6E56, #10B981)',
    },
    {
      emoji: '🌍',
      title: '29 भारतीय भाषाएं',
      titleEn: '29 Indian Languages',
      desc: 'हिंदी, तमिल, तेलुगु, बांग्ला, मराठी... आपकी अपनी बोली में वित्तीय सलाह।',
      descEn: 'Hindi, Tamil, Telugu, Bengali, Marathi... financial advice in your dialect.',
      gradient: 'linear-gradient(135deg, #2563EB, #7C3AED)',
    },
    {
      emoji: '♿',
      title: 'सबके लिए बना है',
      titleEn: 'Built for Everyone',
      desc: 'दृष्टिबाधित, श्रवणबाधित, शारीरिक रूप से अक्षम — सभी के लिए पूर्ण पहुंच।',
      descEn: 'Visually, hearing, physically impaired — full access for all.',
      gradient: 'linear-gradient(135deg, #DC2626, #F97316)',
    },
  ];

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      try {
        localStorage.setItem('vaani_onboarding_complete', '1');
      } catch {}
      onComplete();
    }
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('vaani_onboarding_complete', '1');
    } catch {}
    onComplete();
  };

  const screen = screens[currentScreen];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: screen.gradient,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        transition: 'background 0.5s ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Skip */}
      <button
        onClick={handleSkip}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          padding: '8px 20px',
          borderRadius: '980px',
          fontSize: '14px',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
        }}
        aria-label="Skip onboarding"
      >
        Skip →
      </button>

      {/* Content */}
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <div
          style={{
            fontSize: '80px',
            marginBottom: '32px',
            animation: 'pulse 2s ease-in-out infinite',
          }}
          aria-hidden="true"
        >
          {screen.emoji}
        </div>

        <h1 style={{
          fontSize: '36px',
          fontWeight: 800,
          color: 'white',
          marginBottom: '8px',
          lineHeight: 1.2,
        }}>
          {screen.title}
        </h1>

        <p style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '24px',
          fontWeight: 500,
        }}>
          {screen.titleEn}
        </p>

        <p style={{
          fontSize: '18px',
          color: 'rgba(255,255,255,0.9)',
          lineHeight: 1.6,
          marginBottom: '48px',
        }}>
          {screen.desc}
        </p>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {screens.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentScreen ? '32px' : '8px',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: i === currentScreen ? 'white' : 'rgba(255,255,255,0.3)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Next / Get Started */}
      <button
        onClick={handleNext}
        style={{
          background: 'white',
          border: 'none',
          color: '#111',
          padding: '16px 48px',
          borderRadius: '980px',
          fontSize: '18px',
          fontWeight: 700,
          cursor: 'pointer',
          minWidth: '200px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          transition: 'transform 0.2s ease',
        }}
        onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
        onMouseOut={e => e.target.style.transform = 'scale(1)'}
        aria-label={currentScreen === screens.length - 1 ? 'Start using VAANI' : 'Next screen'}
      >
        {currentScreen === screens.length - 1 ? 'शुरू करें 🚀' : 'आगे →'}
      </button>
    </div>
  );
}
