import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { languages } from '../data/languages.js';
import { getRegionByPincode } from '../services/pincodeService.js';
import { useLandingVoice } from '../hooks/useLandingVoice.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { extractDigitsFromText } from '../data/indianDigitMap.js';
import PincodeLanguageDemo from '../components/PincodeLanguageDemo.jsx';

function VaaniLogo({ size = 32 }) {
  const barHeights = [8, 14, 20, 14, 8];
  const barWidth = 3;
  const barGap = 2;
  const totalBarWidth = barHeights.length * barWidth + (barHeights.length - 1) * barGap;
  const maxBarHeight = Math.max(...barHeights);
  const svgHeight = size;
  const scale = svgHeight / maxBarHeight;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <svg
        width={totalBarWidth * scale}
        height={svgHeight}
        viewBox={`0 0 ${totalBarWidth} ${maxBarHeight}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {barHeights.map((h, i) => (
          <rect
            key={i}
            x={i * (barWidth + barGap)}
            y={maxBarHeight - h}
            width={barWidth}
            height={h}
            rx={1.5}
            fill="#0F6E56"
          />
        ))}
      </svg>
      <span
        style={{
          fontWeight: 700,
          fontSize: `${size * 0.85}px`,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #00D4AA, #10B981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '0.5px',
        }}
      >
        VAANI
      </span>
    </span>
  );
}

const DEFAULT_HEADLINE = { line1: 'Your Voice.', line2: 'Your Language.', sub: "India's first voice-first financial advisor" };

const LANG_HEADLINES = {
  hi: { line1: 'आपकी आवाज़।', line2: 'आपकी भाषा।', sub: 'भारत का पहला वॉइस-फर्स्ट वित्तीय सलाहकार' },
  bn: { line1: 'আপনার কণ্ঠস্বর।', line2: 'আপনার ভাষা।', sub: 'ভারতের প্রথম ভয়েস-ফার্স্ট আর্থিক উপদেষ্টা' },
  te: { line1: 'మీ స్వరం।', line2: 'మీ భాష।', sub: 'భారతదేశ మొదటి వాయిస్-ఫస్ట్ ఆర్థిక సలహాదారు' },
  ta: { line1: 'உங்கள் குரல்।', line2: 'உங்கள் மொழி।', sub: 'இந்தியாவின் முதல் குரல்-முதல் நிதி ஆலோசகர்' },
  mr: { line1: 'तुमचा आवाज।', line2: 'तुमची भाषा।', sub: 'भारताचा पहिला व्हॉइस-ఫర్స్ట ఆర్థिक सल्लागार' },
  gu: { line1: 'તમારો અવાજ।', line2: 'તમારી ભાષા।', sub: 'ભારતનો પ્રથમ વૉઇસ-ફર્સ્ટ નાણાકીય સલાહકાર' },
  kn: { line1: 'ನಿಮ್ಮ ಧ್ವನಿ।', line2: 'ನಿಮ್ಮ ಭಾಷೆ।', sub: 'ಭಾರತದ ಮೊದಲ ವಾಯ್ಸ್-ఫస్ట్ హಣಕಾಸು ಸಲಹೆಗಾರ' },
  ml: { line1: 'നിങ്ങളുടെ ശബ്ദം।', line2: 'നിങ്ങളുടെ ഭാഷ।', sub: 'ഇന്ത്യയുടെ ആദ്യ വോയ്സ്-ఫస్ఱ്റ് ధനകാര്യ ഉപദേഷ്ടാവ്' },
  pa: { line1: 'ਤੁਹਾਡੀ ਆਵਾਜ਼।', line2: 'ਤੁਹਾਡੀ ਭਾਸ਼ਾ।', sub: 'ਭਾਰਤ ਦਾ ਪਹਿਲਾ ਵੌਇਸ-ਫਸਟ ਵਿੱਤੀ ਸਲਾਹਕਾਰ' },
  or: { line1: 'ଆପଣଙ୍କ ସ୍ୱର।', line2: 'ଆପଣଙ୍କ ଭାଷା।', sub: 'ଭାରତର ପ୍ରଥମ ଭଏସ-ଫାର୍ଷ୍ଟ ଆର୍ଥିକ ସଲାହକାର' },
  ur: { line1: 'آپ کی آواز۔', line2: 'آپ کی زبان۔', sub: 'ہندوستان کا پہلا وائس فرسٹ مالی مددگار' },
  as: { line1: 'আপোনাৰ মাত।', line2: 'আপোনাৰ ভাষা।', sub: 'ভাৰতৰ প্ৰথম ভইচ-ফাৰ্ষ্ট বিত্তীয় সহায়ক' },
  en: { line1: 'Your Voice.', line2: 'Your Language.', sub: "India's first voice-first financial advisor" },
  mni: { line1: 'নখোয়গী লৈথং।', line2: 'নখোয়গী মশিং।', sub: 'ভারতকী ফার্স্ট ভয়েস-ফার্স্ট ফিনান্সিয়েল এডভাইজর' },
  sat: { line1: 'ᱟᱯᱮ ᱟᱣᱟᱡ।', line2: 'ᱟᱯᱮ ᱯᱷᱟᱥᱟ।', sub: 'ᱦᱤᱸᱫ ᱨᱮᱭᱟᱜ ᱯᱷᱚᱨᱥᱴ ᱵᱷᱚᱭᱥ-ᱯᱷᱚᱨᱥᱴ ᱯᱷᱟᱭᱤᱱᱮᱱᱥᱤᱭᱚᱞ' },
  mai: { line1: 'अपन अवाज।', line2: 'अपन भाषा।', sub: 'भारतक पहिल वॉइस-फर्स्ट वित्तीय सलाहकार' },
  bho: { line1: 'रउवा के आवाज।', line2: 'रउवा के भाषा।', sub: 'भारत के पहिला वॉइस-फर्स्ट वित्तीय सलाहकार' },
  raj: { line1: 'थांकी आवाज।', line2: 'थांकी भाषा।', sub: 'भारत रो पहलो वॉइस-ఫర్స్ట విత్తీయ सలహాదారు' },
  ne: { line1: 'तपाईंको आवाज।', line2: 'तपाईंको भाषा।', sub: 'भारतको पहिलो భ్వైస్-ఫర్స్ట విత్తీయ సలహాదారు' },
  ks: { line1: 'تۄہۍ آواز۔', line2: 'تۄہۍ زبان۔', sub: 'ہِنۡدوستانۡ ہُند پَتَھر وائس-فَرسۡٹ مالی مَددگار' },
  sd: { line1: 'توهان جي آواز۔', line2: 'توهان جي ٻولي۔', sub: 'هندستان جو پهريون وائس-فرسٽ مالي مددگار' },
};

const FEATURES = [
  { icon: '🗣️', title: '28 Languages, 100+ Dialects', desc: 'Not Hindi translation. Actual Bhojpuri, Awadhi, Maithili, Bundeli — how your village speaks.', quote: '"Bhojpuri mein samjhao, reminder bhejo."' },
  { icon: '🏦', title: 'FD Ladder Optimizer', desc: 'Splits your savings across banks for maximum interest + TDS harvesting. Institutional strategy, ₹10,000 minimum.', quote: '"SBI mein 6 months, HDFC mein 12 months..."' },
  { icon: '💍', title: 'Life-Event Prediction', desc: 'Detects wedding/harvest signals from your chat. Auto-aligns FD maturity to your event date.', quote: '"Shaadi ka season Shuru, deposit ki maturity date check karo."' },
  { icon: '📊', title: 'Full Portfolio Tracker', desc: 'FDs, SIPs, crypto wallets, bank accounts — one dashboard in your language.', quote: '"Aapke portfolio mein 3 FD, 2 SIP aur 1 crypto wallet hai."' },
  { icon: '🧠', title: 'Emotional Finance AI', desc: "Detects anxiety in your words. Switches to village analogies. 'FD = galla band.'", quote: '"Chinta mat karo, gallaband hai, paisa safe hai."' },
  { icon: '🌍', title: 'Hyperlocal Trust', desc: "'17,832 people from Gorakhpur invested via VAANI.' Your city's numbers, not national averages.", quote: '"Aapke area mein 5,000 log VAANI use karte hain."' },
];

const STATS = [
  { value: '500M+', label: 'rural Indians served' },
  { value: '28', label: 'states covered' },
  { value: '₹10,000', label: 'minimum to start' },
  { value: '100%', label: 'free forever' },
];

function ChatBubble({ children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.07)',
      borderRadius: '16px 16px 16px 4px',
      padding: '14px 16px',
      marginBottom: '8px',
      maxWidth: '200px',
      fontSize: '13px',
      color: '#fff',
      lineHeight: 1.5,
      animation: 'bubbleRise 0.4s ease-out',
    }}>
      {children}
    </div>
  );
}

function PhoneMockup() {
  return (
    <div style={{
      width: '220px',
      height: '440px',
      background: '#0D1F1F',
      borderRadius: '36px',
      border: '3px solid rgba(255,255,255,0.12)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
      animation: 'phoneFloat 6s ease-in-out infinite',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '80px', height: '24px', background: '#0D1F1F',
        borderRadius: '0 0 16px 16px', zIndex: 10,
      }} />
      <div style={{ padding: '40px 16px 16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: '#0F6E56', borderRadius: '16px 16px 4px 16px', padding: '10px 14px', maxWidth: '160px', fontSize: '13px', color: '#fff', animation: 'bubbleRise 0.4s ease-out 0.3s both' }}>
            Mujhe SIP ke baare mein batayein
          </div>
        </div>
        <div style={{ animation: 'bubbleRise 0.4s ease-out 0.8s both' }}>
          <ChatBubble>SIP matlab Systematic Investment Plan. Ye fixed amount har mahina invest karna.</ChatBubble>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'bubbleRise 0.4s ease-out 1.3s both' }}>
          <div style={{ background: 'rgba(255,107,0,0.8)', borderRadius: '16px 16px 4px 16px', padding: '10px 14px', maxWidth: '160px', fontSize: '13px', color: '#fff' }}>
            Kaunsa fund best hai?
          </div>
        </div>
        <div style={{ animation: 'bubbleRise 0.4s ease-out 1.8s both' }}>
          <ChatBubble>Large cap fund stable hota hai. HDFC Bond,SBI Bluechip try karo.</ChatBubble>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onStart }) {
  const navigate = useNavigate();
  const [selectedLangIndex, setSelectedLangIndex] = useState(0);
  const [headlineFade, setHeadlineFade] = useState(true);
  const [activeHeadline, setActiveHeadline] = useState(DEFAULT_HEADLINE);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const { language, setLanguage: setGlobalLanguage } = useLanguage();
  const currentLangCode = languages[selectedLangIndex]?.code || 'hi';

  useEffect(() => {
    const langCode = languages[selectedLangIndex]?.code || 'hi';
    const newHeadline = LANG_HEADLINES[langCode] || DEFAULT_HEADLINE;
    if (JSON.stringify(newHeadline) === JSON.stringify(activeHeadline)) return;
    setHeadlineFade(false);
    setTimeout(() => {
      setActiveHeadline(newHeadline);
      setHeadlineFade(true);
    }, 150);
  }, [selectedLangIndex]);

  const handleLanguageSelect = (lang, index) => {
    setSelectedLangIndex(index);
    setLangDropdownOpen(false);
    try { localStorage.setItem('vaani_language', lang.code); } catch {}
    setGlobalLanguage(lang.code);
  };

  return (
    <div style={{ background: '#061A1A', minHeight: '100vh', color: '#ffffff', fontFamily: 'system-ui, "Noto Sans Devanagari", sans-serif' }}>
      <style>{`
        @keyframes bubbleRise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes phoneFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-anim { animation: fadeUp 0.7s ease-out both; }
        .hero-anim-1 { animation-delay: 0.1s; }
        .hero-anim-2 { animation-delay: 0.2s; }
        .hero-anim-3 { animation-delay: 0.3s; }
        .hero-anim-4 { animation-delay: 0.4s; }
        .hero-anim-5 { animation-delay: 0.5s; }
        .card-hover { transition: border-color 0.3s ease; }
        .card-hover:hover { border-color: rgba(255,107,0,0.4) !important; }
        .dropdown-anim { animation: slideDown 0.2s ease-out; }
        .phone-mockup { display: block; }
        @media (max-width: 768px) {
          .phone-mockup { display: none !important; }
          .hero-grid { flex-direction: column !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { flex-wrap: wrap !important; }
        }
      `}</style>

      {/* ═══ SECTION 1: NAVBAR ═══ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '64px',
        backgroundColor: 'rgba(6,26,26,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <VaaniLogo size={24} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.2s',
              }}
            >
              {languages[selectedLangIndex]?.nativeName || 'हिन्दी'} ▾
            </button>
            {langDropdownOpen && (
              <div
                className="dropdown-anim"
                style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: '#0D2020', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '8px', zIndex: 200,
                  width: '180px', maxHeight: '280px', overflowY: 'auto',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                }}
              >
                {languages.map((lang, i) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang, i)}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none',
                      border: 'none', color: selectedLangIndex === i ? '#10B981' : '#fff',
                      padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '13px', transition: 'background 0.15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                  >
                    {lang.nativeName} — {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Dashboard
          </button>

          <button
            onClick={() => navigate('/auth')}
            style={{
              background: '#FF6B00',
              border: 'none',
              color: '#fff',
              padding: '8px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* ═══ SECTION 2: HERO ═══ */}
      <section style={{
        minHeight: '100dvh',
        background: 'radial-gradient(ellipse at 30% 50%, rgba(29,158,117,0.15) 0%, #061A1A 60%)',
        display: 'flex', alignItems: 'center',
        padding: '80px 24px 60px',
      }}>
        <div
          className="hero-grid"
          style={{
            maxWidth: '1100px', margin: '0 auto', width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '60px',
          }}
        >
          {/* Left: headline stack */}
          <div style={{ flex: '1', maxWidth: '520px' }}>
            <div style={{ opacity: headlineFade ? 1 : 0, transition: 'opacity 0.15s ease' }}>
              <h1 style={{
                fontSize: '64px', fontWeight: 800, lineHeight: 1.1,
                color: '#ffffff', margin: '0 0 8px',
                animation: 'fadeUp 0.7s ease-out both',
              }}>
                {activeHeadline.line1}
              </h1>
              <h1 style={{
                fontSize: '64px', fontWeight: 800, lineHeight: 1.1,
                background: 'linear-gradient(135deg, #00D4AA, #10B981)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', margin: '0 0 20px',
                animation: 'fadeUp 0.7s ease-out 0.1s both',
              }}>
                {activeHeadline.line2}
              </h1>
              <p style={{
                fontSize: '18px', color: 'rgba(255,255,255,0.5)',
                maxWidth: '480px', lineHeight: 1.6, margin: '0 0 28px',
                animation: 'fadeUp 0.7s ease-out 0.2s both',
              }}>
                {activeHeadline.sub}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button
                onClick={onStart}
                style={{
                  height: '52px', padding: '0 32px',
                  background: '#FF6B00', border: 'none', borderRadius: '14px',
                  color: '#fff', fontSize: '16px', fontWeight: 700,
                  cursor: 'pointer', animation: 'fadeUp 0.7s ease-out 0.3s both',
                }}
              >
                Try VAANI Free
              </button>
              <button
                style={{
                  height: '52px', padding: '0 32px',
                  background: 'transparent', border: '1.5px solid rgba(255,255,255,0.4)',
                  borderRadius: '14px', color: '#fff', fontSize: '16px',
                  cursor: 'pointer', animation: 'fadeUp 0.7s ease-out 0.4s both',
                }}
              >
                Watch Demo
              </button>
            </div>

            <p style={{
              fontSize: '13px', color: 'rgba(255,255,255,0.35)',
              animation: 'fadeUp 0.7s ease-out 0.5s both',
            }}>
              No signup needed · 28 languages · 100% free
            </p>
          </div>

          {/* Right: phone mockup */}
          <div className="phone-mockup" style={{ flexShrink: 0 }}>
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: PINCODE DEMO ═══ */}
      <section style={{ padding: '80px 24px', background: '#061A1A' }}>
        <h2 style={{
          fontSize: '28px', fontWeight: 700, color: '#fff', textAlign: 'center',
          marginBottom: '12px',
        }}>
          Type your pincode — VAANI speaks your language
        </h2>
        <p style={{
          fontSize: '15px', color: 'rgba(255,255,255,0.4)', textAlign: 'center',
          marginBottom: '40px',
        }}>
          Enter any Indian pincode and VAANI responds in the region's dialect
        </p>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '20px', padding: '32px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <PincodeLanguageDemo />
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4: FEATURES ═══ */}
      <section style={{ padding: '80px 24px', background: '#0A1A1A' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: '8px' }}>
          Built for Bharat
        </h2>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '48px' }}>
          Not a bank. Not a broker. Your village's financial advisor.
        </p>
        <div
          className="features-grid"
          style={{
            maxWidth: '900px', margin: '0 auto',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px',
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="card-hover"
              style={{
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: '16px', padding: '24px',
                animation: 'fadeUp 0.6s ease-out both',
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '14px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: '12px' }}>{f.desc}</p>
              <p style={{ fontSize: '12px', color: '#FF6B00', fontStyle: 'italic' }}>{f.quote}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SECTION 5: STATS ROW ═══ */}
      <section style={{ background: '#FF6B00', padding: '48px 24px' }}>
        <div
          className="stats-grid"
          style={{
            maxWidth: '900px', margin: '0 auto',
            display: 'flex', justifyContent: 'space-around', gap: '24px',
          }}
        >
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '6px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SECTION 6: FOOTER ═══ */}
      <footer style={{
        background: '#061A1A', padding: '40px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <VaaniLogo size={22} />
            <div style={{ display: 'flex', gap: '24px' }}>
              {['Privacy', 'Terms', 'Contact'].map(link => (
                <a
                  key={link}
                  href="#"
                  style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none' }}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', margin: 0 }}>
            Made for Bharat 🇮🇳
          </p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: '8px 0 0' }}>
            VAANI is not a bank or financial advisor. We provide information only.
          </p>
        </div>
      </footer>
    </div>
  );
}