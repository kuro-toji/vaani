import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useChat } from '../hooks/useChat';
// import VaaniScoreGauge from './VaaniScoreGauge';

const DashboardPage = ({ onBack, onOpenChat }) => {
  const { language } = useLanguage();

  const getGreeting = () => {
    const hour = new Date().getHours();
    let time = 'morning';
    if (hour >= 12 && hour < 17) time = 'afternoon';
    else if (hour >= 17) time = 'evening';
    
    // As per requirement, specific mappings for morning
    const baseMap = {
      hi: 'सुप्रभात',
      en: 'Good morning',
      te: 'శుభోదయం',
      ta: 'காலை வணக்கம்',
      bn: 'শুভ সকাল',
      mr: 'सुप्रभात',
      default: 'Hello'
    };
    
    return baseMap[language] || baseMap.en || baseMap.default;
  };

  const greeting = getGreeting();

  const [matchesMobile, setMatchesMobile] = useState(window.innerWidth < 640);
  
  useEffect(() => {
    const handler = () => setMatchesMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div style={{
      backgroundColor: '#0F172A',
      minHeight: '100vh',
      width: '100%',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative'
    }}>
      <style>{`
        @keyframes orbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* HEADER */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '64px', padding: '0 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={onBack} style={{
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
              fontSize: '20px', cursor: 'pointer', padding: '8px', minWidth: '44px', minHeight: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              ←
            </button>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '20px' }}>
              <rect x="0" y="12" width="3" height="8" rx="1.5" fill="#0F6E56" />
              <rect x="5" y="6" width="3" height="14" rx="1.5" fill="#0F6E56" />
              <rect x="10" y="0" width="3" height="20" rx="1.5" fill="#0F6E56" />
              <rect x="15" y="6" width="3" height="14" rx="1.5" fill="#0F6E56" />
              <rect x="20" y="12" width="3" height="8" rx="1.5" fill="#0F6E56" />
            </svg>
            <span style={{
              fontSize: '20px', fontWeight: 800, letterSpacing: '1px',
              background: 'linear-gradient(to right, #00D4AA, #10B981)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>VAANI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)', padding: '4px 12px',
              borderRadius: '999px', fontSize: '13px', color: 'white', fontWeight: 500
            }}>
              {language}
            </div>
            <button style={{
              background: 'none', border: 'none', color: 'white', fontSize: '20px',
              cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)'
            }}>⚙️</button>
          </div>
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
          padding: '0 0 10px 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)', width: '100%'
        }}>
          <span>Home</span>
          <span>→</span>
          <span style={{ color: '#10B981', fontWeight: 500 }}>Dashboard</span>
          <span>→</span>
          <span>Chat with Vaani</span>
        </div>
      </header>

      <main style={{ paddingBottom: '90px' }}>
        {/* HERO SECTION */}
        <section style={{
          paddingTop: '120px', paddingBottom: '40px', textAlign: 'center',
          animation: 'fadeUp 0.6s ease-out both'
        }}>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, color: 'white',
            margin: '0 0 8px 0', padding: '0 16px'
          }}>
            {greeting}, Vaani is ready
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.5)', fontSize: '16px', margin: 0
          }}>
            Your financial advisor is listening
          </p>

          {/* BIG TALK BUTTON */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            marginTop: '40px', animation: 'fadeUp 0.6s ease-out 0.2s both'
          }}>
            <button
              onClick={onOpenChat}
              style={{
                width: '140px', height: '140px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'radial-gradient(circle at 35% 35%, #1D9E75, #0F6E56 55%, #052e1a)',
                boxShadow: '0 0 60px rgba(16,185,129,0.4), 0 20px 60px rgba(0,0,0,0.5)',
                animation: 'orbFloat 4s ease-in-out infinite',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
              </svg>
            </button>
            <span style={{
              color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '12px', fontWeight: 500
            }}>Tap to Talk</span>
          </div>
        </section>

        {/* STATS CARDS ROW */}
        <section style={{
          display: 'grid', gridTemplateColumns: matchesMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '16px', maxWidth: '640px', margin: '48px auto 0', padding: '0 16px',
          animation: 'fadeUp 0.6s ease-out 0.3s both'
        }}>
          {[
            { emoji: '📈', title: "Today's Best FD", value: "7.15% — Post Office" },
            { emoji: '🏦', title: "PPF Rate", value: "7.1% Tax Free" },
            { emoji: '💎', title: "SGB Return", value: "Gold + 2.5%" }
          ].map((card, idx) => (
            <div key={idx} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px', padding: '20px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
              <div style={{ fontSize: '32px' }}>{card.emoji}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '8px' }}>{card.title}</div>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{card.value}</div>
            </div>
          ))}
        </section>

        {/* QUICK TOPICS */}
        <section style={{
          padding: '0 16px', maxWidth: '640px', margin: '32px auto 0',
          textAlign: 'center', animation: 'fadeUp 0.6s ease-out 0.4s both'
        }}>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 600, marginBottom: '12px', textAlign: 'left' }}>
            What do you want to know?
          </h2>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start'
          }}>
            {["🏦 FD Rates", "📮 Post Office", "💰 SIP & MF", "🛡️ Insurance"].map((topic, idx) => (
              <button key={idx} onClick={onOpenChat} style={{
                padding: '12px 20px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px',
                color: 'white', fontSize: '14px', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}>
                {topic}
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, width: '100%',
        padding: '12px 24px', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'center', zIndex: 10, boxSizing: 'border-box'
      }}>
        <button onClick={onOpenChat} style={{
          width: '100%', maxWidth: '400px', height: '52px',
          background: 'linear-gradient(135deg, #0F6E56, #1D9E75)',
          borderRadius: '999px', color: 'white', fontSize: '16px',
          fontWeight: 700, border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          💬 Talk to Vaani
        </button>
      </footer>
    </div>
  );
};

export default DashboardPage;
