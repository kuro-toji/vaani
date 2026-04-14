import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { matchSchemes } from '../data/governmentSchemes';
import { getRegionByPincode } from '../services/pincodeService';
import { FD_RATES } from '../data/fdRates';

const DashboardPage = ({ onBack, onOpenChat }) => {
  const { language } = useLanguage();
  const lang = language || 'hi';

  const [userProfile, setUserProfile] = useState({
    state: null,
    region: null,
    pincode: null,
    language: null,
  });
  const [matchedSchemes, setMatchedSchemes] = useState([]);
  const [bestFD, setBestFD] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from localStorage and resolve state
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const pincode = localStorage.getItem('vaani_pincode');
        const userLang = localStorage.getItem('vaani_language') || 'hi';

        if (pincode) {
          const regionData = await getRegionByPincode(pincode);
          if (regionData) {
            setUserProfile({
              state: regionData.state,
              region: regionData.region,
              pincode,
              language: userLang,
            });

            // Match schemes based on state and language
            const schemes = matchSchemes({
              state: regionData.state,
              occupation: '',
              age: '',
              gender: '',
              income: '',
            });
            setMatchedSchemes(schemes.slice(0, 6));

            // Find best FD rate for this state
            const topFD = [...FD_RATES]
              .sort((a, b) => {
                const aRate = a.rates['1y'] || Object.values(a.rates).pop() || 0;
                const bRate = b.rates['1y'] || Object.values(b.rates).pop() || 0;
                return bRate - aRate;
              })
              .slice(0, 1)[0];
            if (topFD) {
              const rate = topFD.rates['1y'] || Object.values(topFD.rates).pop();
              setBestFD({ bank: topFD.bank_short || topFD.bank_id, rate });
            }
          }
        } else {
          // No pincode — show default schemes and best overall FD
          const defaultSchemes = matchSchemes({});
          setMatchedSchemes(defaultSchemes.slice(0, 6));
          const topFD = [...FD_RATES]
            .sort((a, b) => {
              const aRate = a.rates['1y'] || Object.values(a.rates).pop() || 0;
              const bRate = b.rates['1y'] || Object.values(b.rates).pop() || 0;
              return bRate - aRate;
            })
            .slice(0, 1)[0];
          if (topFD) {
            const rate = topFD.rates['1y'] || Object.values(topFD.rates).pop();
            setBestFD({ bank: topFD.bank_short || topFD.bank_id, rate });
          }
        }
      } catch (err) {
        console.warn('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    let time = 'morning';
    if (hour >= 12 && hour < 17) time = 'afternoon';
    else if (hour >= 17) time = 'evening';

    const greetings = {
      hi: { morning: 'सुप्रभात', afternoon: 'नमस्ते', evening: 'शुभ संध्या' },
      en: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
      ta: { morning: 'காலை வணக்கம்', afternoon: 'மதிய வணக்கம்', evening: 'மாலை வணக்கம்' },
      te: { morning: 'శుభోదయం', afternoon: 'మధ్యాహ్న వందనాలు', evening: 'సాయంత్ర వందనాలు' },
      bn: { morning: 'শুভ সকাল', afternoon: 'শুভ মধ্যাহ্ন', evening: 'শুভ সন্ধ্যা' },
      mr: { morning: 'सुप्रभात', afternoon: 'नमस्कार', evening: 'शुभ संध्या' },
      default: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
    };

    const langGreet = greetings[lang] || greetings.default;
    return langGreet[time] || langGreet.morning;
  }, [lang]);

  const greeting = getGreeting();

  const [matchesMobile, setMatchesMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handler = () => setMatchesMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const langLabels = {
    hi: { schemes: 'आपके लिए योजनाएं', bestFD: 'सबसे बेहतर FD', fdRate: 'FD दर', viewAll: 'सभी देखें', yourState: 'आपका राज्य', notSet: 'सेट नहीं' },
    en: { schemes: 'Schemes For You', bestFD: "Today's Best FD", fdRate: 'FD Rate', viewAll: 'View All', yourState: 'Your State', notSet: 'Not set' },
    ta: { schemes: 'உங்களுக்கான திட்டங்கள்', bestFD: 'இன்றைய சிறந்த FD', fdRate: 'FD விகிதம்', viewAll: 'அனைத்தையும் காண்க', yourState: 'உங்கள் மாநிலம்', notSet: 'அமைக்கப்படவில்லை' },
    te: { schemes: 'మీ కోసం పథకాలు', bestFD: 'ఈ రోజు ఉత్తమ FD', fdRate: 'FD రేటు', viewAll: 'అన్నీ చూడండి', yourState: 'మీ రాష్ట్రం', notSet: 'సెట్ చేయలేదు' },
    bn: { schemes: 'আপনার জন্য প্রকল্প', bestFD: 'আজকের সেরা FD', fdRate: 'FD হার', viewAll: 'সব দেখুন', yourState: 'আপনার রাজ্য', notSet: 'সেট করা হয়নি' },
    mr: { schemes: 'आपल्यासाठी योजना', bestFD: 'आजची सर्वोत्तम FD', fdRate: 'FD दर', viewAll: 'सर्व पाहा', yourState: 'आपले राज्य', notSet: 'सेट नाही' },
    default: { schemes: 'Schemes For You', bestFD: "Today's Best FD", fdRate: 'FD Rate', viewAll: 'View All', yourState: 'Your State', notSet: 'Not set' },
  };
  const t = langLabels[lang] || langLabels.default;

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
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .shimmer { background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .scheme-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
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
            {userProfile.state && (
              <div style={{
                background: 'rgba(16,185,129,0.15)', padding: '4px 12px',
                borderRadius: '999px', fontSize: '13px', color: '#10B981', fontWeight: 500
              }}>
                📍 {userProfile.region || userProfile.state}
              </div>
            )}
            <div style={{
              background: 'rgba(255,255,255,0.1)', padding: '4px 12px',
              borderRadius: '999px', fontSize: '13px', color: 'white', fontWeight: 500
            }}>
              {lang.toUpperCase()}
            </div>
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
          paddingTop: '120px', paddingBottom: '32px', textAlign: 'center',
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
            marginTop: '32px', animation: 'fadeUp 0.6s ease-out 0.2s both'
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

        {/* SCHEMES SECTION */}
        <section style={{
          padding: '0 16px', maxWidth: '640px', margin: '0 auto',
          animation: 'fadeUp 0.6s ease-out 0.25s both'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, margin: 0 }}>
              {t.schemes}
            </h2>
            {userProfile.state && (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                {t.yourState}: {userProfile.state}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="shimmer" style={{ height: '100px', borderRadius: '16px' }} />
              ))}
            </div>
          ) : matchedSchemes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matchedSchemes.slice(0, 5).map(scheme => (
                <div
                  key={scheme.id}
                  className="scheme-card"
                  onClick={onOpenChat}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '32px', flexShrink: 0 }}>{scheme.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                      {scheme.nameHindi || scheme.name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '8px' }}>
                      {scheme.name}
                    </div>
                    <div style={{
                      background: 'rgba(16,185,129,0.15)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '13px',
                      color: '#10B981',
                      fontWeight: 600,
                      display: 'inline-block',
                    }}>
                      💰 {scheme.benefit}
                    </div>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px', flexShrink: 0 }}>
                    →
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '32px',
              background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
              color: 'rgba(255,255,255,0.4)', fontSize: '14px'
            }}>
              Tell Vaani about yourself to get personalized scheme recommendations
            </div>
          )}
        </section>

        {/* STATS CARDS ROW */}
        <section style={{
          display: 'grid', gridTemplateColumns: matchesMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '16px', maxWidth: '640px', margin: '32px auto 0', padding: '0 16px',
          animation: 'fadeUp 0.6s ease-out 0.3s both'
        }}>
          {[
            { emoji: '🏦', title: t.bestFD, value: bestFD ? `${bestFD.rate}% — ${bestFD.bank}` : '7.15% — Post Office', highlight: true },
            { emoji: '🏛️', title: 'PPF Rate', value: '7.1% Tax Free' },
            { emoji: '💎', title: 'SGB Return', value: 'Gold + 2.5%' },
          ].map((card, idx) => (
            <div key={idx} style={{
              background: card.highlight ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
              border: card.highlight ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px', padding: '20px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
              <div style={{ fontSize: '32px' }}>{card.emoji}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '8px' }}>{card.title}</div>
              <div style={{ color: card.highlight ? '#10B981' : 'white', fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{card.value}</div>
            </div>
          ))}
        </section>

        {/* QUICK TOPICS */}
        <section style={{
          padding: '0 16px', maxWidth: '640px', margin: '32px auto 0',
          textAlign: 'left', animation: 'fadeUp 0.6s ease-out 0.4s both'
        }}>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            What do you want to know?
          </h2>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start'
          }}>
            {["🏦 FD Rates", "📮 Post Office", "💰 SIP & MF", "🛡️ Insurance", "🏠 PM Awas", "👧 Sukanya"].map((topic, idx) => (
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
