import { useState, useEffect, useCallback } from 'react';

const LANG_PILLS = [
  'हिन्दी', 'বাংলা', 'తెలుగు', 'मराठी', 'தமிழ்', 'اردو', 'ગુજરાતી', 'ಕನ್ನಡ',
  'ਪੰਜਾਬੀ', 'മലയാളം', 'ଓଡ଼ିଆ', 'অসমীয়া', 'नेपाली', 'मैथिली', 'संस्कृत', 'भोजपुरी',
];

const A11Y_OPTIONS = [
  { id: 'blind', emoji: '👁️', hi: 'Aankhon se nahi dekhta', en: "I can't see well", key: 'vaani_autoRead', value: '1' },
  { id: 'deaf', emoji: '👂', hi: 'Sunaai nahi deta', en: "I can't hear well", key: 'vaani_iconMode', value: '1' },
  { id: 'motor', emoji: '🤚', hi: 'Haath kam karta hai', en: 'I have hand difficulty', key: 'vaani_fullScreenPTT', value: '1' },
  { id: 'elderly', emoji: '👴', hi: 'Buzurg hoon', en: "I'm elderly", key: 'vaani_largeText', value: '1' },
  { id: 'fine', emoji: '✅', hi: 'Theek hoon', en: "I'm fine", key: null, value: null },
];

const BACKGROUNDS = [
  'linear-gradient(135deg, #0F172A 0%, #0a2a1a 100%)',
  'linear-gradient(135deg, #0F172A, #1a1040)',
  'linear-gradient(135deg, #0F172A, #1a0a2a)',
  'linear-gradient(135deg, #0F172A, #1a1a0a)',
];

function speakText(text, lang = 'hi-IN') {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

export default function OnboardingFlow({ onComplete }) {
  const [screen, setScreen] = useState(0);
  const [demoPlayed, setDemoPlayed] = useState(false);
  const [showUserBubble, setShowUserBubble] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [showVaaniBubble, setShowVaaniBubble] = useState(false);
  const [selectedA11y, setSelectedA11y] = useState(new Set());

  // Screen 2 demo animation
  useEffect(() => {
    if (screen === 1) {
      setShowUserBubble(false);
      setShowTyping(false);
      setShowVaaniBubble(false);
      const t1 = setTimeout(() => setShowUserBubble(true), 400);
      const t2 = setTimeout(() => setShowTyping(true), 1400);
      const t3 = setTimeout(() => { setShowTyping(false); setShowVaaniBubble(true); }, 2800);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [screen]);

  const handlePlayDemo = useCallback(() => {
    speakText('Namaste! Main Vaani hoon. Aapka muft financial dost. Koi bhi sawaal poochh sakte hain — Hindi mein, Tamil mein, ya aapki kisi bhi bhaasha mein.');
    setDemoPlayed(true);
  }, []);

  const handleA11yToggle = (opt) => {
    setSelectedA11y(prev => {
      const next = new Set(prev);
      // "I'm fine" clears all others
      if (opt.id === 'fine') {
        return next.has('fine') ? new Set() : new Set(['fine']);
      }
      // Remove 'fine' when selecting disabilities
      next.delete('fine');
      if (next.has(opt.id)) {
        next.delete(opt.id);
        if (opt.key) try { localStorage.removeItem(opt.key); } catch {}
      } else {
        next.add(opt.id);
        if (opt.key) try { localStorage.setItem(opt.key, opt.value); } catch {}
        speakText(opt.hi);
      }
      return next;
    });
  };

  const handleFinish = () => {
    try { localStorage.setItem('vaani_onboarding_complete', '1'); } catch {}
    onComplete();
  };

  const handleNext = () => {
    if (screen < 3) setScreen(screen + 1);
    else handleFinish();
  };

  const handleSkip = () => handleFinish();

  const dotStyle = (i) => ({
    width: i === screen ? '24px' : '8px',
    height: '8px',
    borderRadius: '4px',
    backgroundColor: i === screen ? '#10B981' : 'rgba(255,255,255,0.2)',
    transition: 'all 0.3s ease',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: BACKGROUNDS[screen],
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      transition: 'background 0.5s ease',
    }}>
      {/* ── Top bar: dots + skip ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0, 1, 2, 3].map(i => <div key={i} style={dotStyle(i)} />)}
        </div>
        <button onClick={handleSkip} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          fontSize: '14px', cursor: 'pointer', padding: '4px 8px',
        }}>Skip →</button>
      </div>

      {/* ── Content ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', overflow: 'auto',
      }}>

        {/* ═══ SCREEN 1 — TRUST ═══ */}
        {screen === 0 && (
          <div style={{ textAlign: 'center', animation: 'fadeUp 0.5s ease both' }}>
            {/* Checkmark circle */}
            <div style={{
              width: '120px', height: '120px', borderRadius: '50%',
              background: 'rgba(16,185,129,0.2)', border: '3px solid #10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <span style={{ fontSize: '60px', color: '#10B981', lineHeight: 1 }}>✓</span>
            </div>

            <h1 style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '2px', margin: '0 0 8px', color: '#ffffff' }}>VAANI</h1>
            <p style={{ fontSize: '14px', letterSpacing: '3px', color: '#10B981', margin: '0 0 40px' }}>FREE • SAFE • TRUSTED</p>

            {/* Trust lines */}
            {['No money taken', 'No OTP asked', 'No bank details needed'].map((text, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                marginBottom: '16px',
                animation: 'fadeUp 0.4s ease both', animationDelay: `${0.2 + i * 0.15}s`,
                animationFillMode: 'both',
              }}>
                <span style={{ color: '#10B981', fontSize: '22px', fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: '20px', color: '#ffffff', fontWeight: 500 }}>{text}</span>
              </div>
            ))}

            {/* Play demo button */}
            <button
              onClick={handlePlayDemo}
              style={{
                marginTop: '32px', padding: '16px 32px',
                background: demoPlayed ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)',
                border: `2px solid ${demoPlayed ? '#10B981' : 'rgba(16,185,129,0.5)'}`,
                borderRadius: '999px', color: '#ffffff', fontSize: '18px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', gap: '10px',
                margin: '32px auto 0',
              }}
            >
              {demoPlayed ? '✓' : '▶'} सुनिए / Listen
            </button>
          </div>
        )}

        {/* ═══ SCREEN 2 — DEMONSTRATION ═══ */}
        {screen === 1 && (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '360px', animation: 'fadeUp 0.5s ease both' }}>
            {/* Phone frame */}
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '24px',
              border: '2px solid rgba(255,255,255,0.12)', padding: '24px 16px',
              maxWidth: '320px', margin: '0 auto',
              minHeight: '280px', display: 'flex', flexDirection: 'column',
              justifyContent: 'center', gap: '16px',
            }}>
              {/* User bubble */}
              {showUserBubble && (
                <div style={{
                  display: 'flex', justifyContent: 'flex-end',
                  animation: 'fadeUp 0.4s ease both',
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #0F6E56, #1D9E75)',
                    borderRadius: '18px 18px 4px 18px', padding: '14px 18px',
                    color: '#ffffff', fontSize: '16px', fontWeight: 500,
                    maxWidth: '85%', textAlign: 'right',
                  }}>मेरा ₹50,000 कहाँ लगाऊं?</div>
                </div>
              )}

              {/* Typing indicator */}
              {showTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'fadeUp 0.3s ease both' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.1)', borderRadius: '18px 18px 18px 4px',
                    padding: '14px 20px', display: 'flex', gap: '4px', alignItems: 'center',
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.5)',
                        animation: `typingDot 1s ease-in-out ${i * 0.15}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Vaani bubble */}
              {showVaaniBubble && (
                <div style={{
                  display: 'flex', justifyContent: 'flex-start',
                  animation: 'fadeUp 0.4s ease both',
                }}>
                  <div style={{
                    background: '#ffffff', borderRadius: '18px 18px 18px 4px',
                    padding: '14px 18px', color: '#1E293B', fontSize: '15px',
                    fontWeight: 500, maxWidth: '85%', textAlign: 'left', lineHeight: 1.5,
                  }}>SBI में 1 साल FD लगाओ — ₹3,400 ब्याज मिलेगा 🏦</div>
                </div>
              )}
            </div>

            {/* Flow description */}
            <p style={{
              color: 'rgba(255,255,255,0.7)', fontSize: '18px', marginTop: '28px',
              fontWeight: 500, lineHeight: 1.5,
            }}>बोलो → Vaani सुनती है → जवाब मिलता है</p>

            {/* 3 icons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '20px' }}>
              {[
                { icon: '🎤', label: 'Speak' },
                { icon: '👂', label: 'Listen' },
                { icon: '🔊', label: 'Answer' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'rgba(16,185,129,0.15)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', margin: '0 auto 6px',
                  }}>{item.icon}</div>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SCREEN 3 — LANGUAGES ═══ */}
        {screen === 2 && (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '420px', animation: 'fadeUp 0.5s ease both' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>Kaunsi bhaasha?</h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>Which language?</p>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
            }}>
              {LANG_PILLS.map((name, i) => (
                <div key={i} style={{
                  padding: '12px 8px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '12px', fontSize: '18px', color: '#ffffff',
                  fontWeight: 600, textAlign: 'center',
                  animation: 'fadeUp 0.4s ease both',
                  animationDelay: `${i * 0.05}s`, animationFillMode: 'both',
                }}>{name}</div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SCREEN 4 — ACCESSIBILITY CHOICE ═══ */}
        {screen === 3 && (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '420px', animation: 'fadeUp 0.5s ease both' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#ffffff' }}>Aap kaun hain?</h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', marginBottom: '28px' }}>Who are you?</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {A11Y_OPTIONS.map((opt) => {
                const isOn = selectedA11y.has(opt.id);
                return (
                  <button key={opt.id} onClick={() => handleA11yToggle(opt)} style={{
                    padding: '20px 24px',
                    background: isOn ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)',
                    border: isOn ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px',
                    cursor: 'pointer', width: '100%', textAlign: 'left', color: '#ffffff',
                    fontSize: '18px', fontWeight: 500, transition: 'all 0.2s',
                  }}>
                    <span style={{ fontSize: '28px', flexShrink: 0 }}>{opt.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{opt.hi}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{opt.en}</div>
                    </div>
                    {isOn && <span style={{ marginLeft: 'auto', color: '#10B981', fontSize: '22px', flexShrink: 0 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom NEXT button ── */}
      <div style={{ padding: '16px 24px 32px', flexShrink: 0 }}>
        <button
          onClick={handleNext}
          style={{
            width: '100%', height: '60px',
            background: 'linear-gradient(135deg, #0F6E56, #1D9E75)',
            border: 'none', borderRadius: '16px', color: '#ffffff',
            fontSize: '20px', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
            transition: 'all 0.2s',
          }}
        >
          {screen === 3 ? 'Shuru Karen / Let\'s Start →' : 'Next →'}
        </button>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typingDot { 0%,100%{opacity:0.3;transform:translateY(0)} 50%{opacity:1;transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}
