import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { languages } from '../data/languages.js';
import { useLanguage } from '../context/LanguageContext.jsx';

const DEFAULT_HEADLINE = {
  line1: 'Your Voice.',
  line2: 'Your Language.',
  sub: "India's first voice-first financial advisor",
};

const LANG_HEADLINES = {
  hi: { line1: 'आपकी आवाज़।', line2: 'आपकी भाषा।', sub: 'भारत का पहला वॉइस-फर्स्ट वित्तीय सलाहकार' },
  bn: { line1: 'আপনার কণ্ঠস্বর।', line2: 'আপনার ভাষা।', sub: 'ভারতের প্রথম ভয়েস-ফার্স্ট আর্থিক উপদেষ্টা' },
  te: { line1: 'మీ స్వరం।', line2: 'మీ భాష।', sub: 'భారతదేశ మొదటి వాయిస్-ఫర్స్ట్ ఆర్థిక సలహాదారు' },
  ta: { line1: 'உங்கள் குரல்।', line2: 'உங்கள் மொழி।', sub: 'இந்தியாவின் முதல் குரல்-முதல் நிதி ஆலோசகர்' },
  mr: { line1: 'तुमचा आवाज।', line2: 'तुमची भाषा।', sub: 'भारताचा पहिला व्हॉइस-ఫर्स్ట ఆర్థिक सल्लागार' },
  gu: { line1: 'તમારો અવાજ।', line2: 'તમારી ભાષા।', sub: 'ભારતનો પ્રથમ વૉઇસ-ફર્સ્ટ નાણાકીય સલાહકાર' },
  kn: { line1: 'ನಿಮ್ಮ ಧ್ವನಿ।', line2: 'ನಿಮ್ಮ ಭಾಷೆ।', sub: 'ಭಾರತದ ಮೊದಲ ವಾಯ್ಸ್-ఫస్ట్ హಣಕಾಸು ಸಲಹೆಗಾರ' },
  ml: { line1: 'നിങ്ങളുടെ ശബ്ദം।', line2: 'നിങ്ങളുടെ ഭാഷ।', sub: 'ഇന്ത്യയുടെ ആദ്യ വോയ്സ്-ఫస్ఱ്റ് ധനകാര്യ ഉപദേഷ്ടാവ്' },
  pa: { line1: 'ਤੁਹਾਡੀ ਆਵਾਜ਼।', line2: 'ਤੁਹਾਡੀ ਭਾਸ਼ਾ।', sub: 'ਭਾਰਤ ਦਾ ਪਹਿਲਾ ਵੌਇਸ-ਫਸਟ ਵਿੱਤੀ ਸਲਾਹਕਾਰ' },
  or: { line1: 'ଆପଣଙ୍କ ସ୍ୱର।', line2: 'ଆପଣଙ୍କ ଭାଷା।', sub: 'ଭାରତର ପ୍ରଥମ ଭଏସ-ଫାର୍ଷ୍ଟ ଆର୍ଥିକ ସଲାହକାର' },
  en: { line1: 'Your Voice.', line2: 'Your Language.', sub: "India's first voice-first financial advisor" },
  ur: { line1: 'آپ کی آواز۔', line2: 'آپ کی زبان۔', sub: 'ہندوستان کا پہلا وائس فرسٹ مالی مددگار' },
};

const FEATURES = [
  { icon: '🗣️', title: '22 Languages, 100+ Dialects', desc: 'Bhojpuri, Awadhi, Maithili, Bundeli — how your village speaks it.', quote: '"Bhojpuri mein samjhao, reminder bhejo."' },
  { icon: '🏦', title: 'FD Ladder Optimizer', desc: 'Split savings across banks for maximum interest + TDS harvesting.', quote: '"SBI mein 6 months, HDFC mein 12 months..."' },
  { icon: '💍', title: 'Life-Event Prediction', desc: "Detects wedding/harvest signals from chat. Aligns FD maturity to your event.", quote: '"Shaadi ka season shuru, deposit ki maturity date check karo."' },
  { icon: '📊', title: 'Full Portfolio Tracker', desc: "FDs, SIPs, crypto wallets, bank accounts — one dashboard in your language.", quote: '"Aapke portfolio mein 3 FD, 2 SIP aur 1 crypto wallet hai."' },
  { icon: '🧠', title: 'Emotional Finance AI', desc: "Detects anxiety in your words. Switches to village analogies.", quote: '"Chinta mat karo, gallaband hai, paisa safe hai."' },
  { icon: '🌍', title: 'Hyperlocal Trust', desc: 'Your city\'s numbers, not national averages. 17,832 people from Gorakhpur invested via VAANI.', quote: '"Aapke area mein 5,000 log VAANI use karte hain."' },
];

const STATS = [
  { value: '500M+', label: 'rural Indians underserved' },
  { value: '22', label: 'languages covered' },
  { value: '₹10,000', label: 'minimum to start' },
  { value: '100%', label: 'free forever' },
];

function VaaniLogo({ size = 24 }) {
  return (
    <span className="flex items-center gap-2">
      {/* Soundwave V mark */}
      <svg width={size * 1.4} height={size} viewBox="0 0 28 20" fill="none">
        {[6, 10, 14, 10, 6].map((h, i) => (
          <rect key={i} x={i * 5} y={(20 - h) / 2} width={3} height={h} rx={1.5} fill="#1D9E75" />
        ))}
      </svg>
      <span
        className="font-semibold"
        style={{
          fontSize: size * 0.85,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #00D4AA, #10B981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '0.5px',
          fontFamily: 'var(--font-sans)',
        }}
      >
        VAANI
      </span>
    </span>
  );
}

function PhoneMockup() {
  return (
    <div
      className="animate-phoneFloat"
      style={{
        width: '220px', height: '440px',
        background: '#0D1F1F',
        borderRadius: '36px',
        border: '3px solid rgba(255,255,255,0.12)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '80px', height: '24px', background: '#0D1F1F',
        borderRadius: '0 0 16px 16px', zIndex: 10,
      }} />

      <div style={{ padding: '40px 16px 16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '8px' }}>
        {/* User bubble */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            background: 'var(--primary)', borderRadius: '16px 16px 4px 16px',
            padding: '10px 14px', maxWidth: '160px', fontSize: '13px', color: '#fff',
            animation: 'bubbleRise 0.4s ease-out 0.3s both',
          }}>
            SIP ke baare mein batao
          </div>
        </div>
        {/* AI bubble */}
        <div className="animate-bubbleRise" style={{ animationDelay: '0.8s' }}>
          <div className="glass" style={{ borderRadius: '16px 16px 16px 4px', padding: '10px 14px', maxWidth: '175px', fontSize: '12px', color: '#fff', lineHeight: 1.5 }}>
            SIP matlab Systematic Investment Plan. Ye fixed amount har mahina invest karna. HDFC Bond fund stable hota hai.
          </div>
        </div>
        {/* User bubble */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'bubbleRise 0.4s ease-out 1.3s both' }}>
          <div style={{
            background: 'var(--accent)', borderRadius: '16px 16px 4px 16px',
            padding: '10px 14px', maxWidth: '160px', fontSize: '13px', color: '#fff',
          }}>
            Kaunsa fund best hai?
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onStart }) {
  const navigate = useNavigate();
  const { language: globalLang, setLanguage: setGlobalLang } = useLanguage();
  const [selectedLangIndex, setSelectedLangIndex] = useState(
    () => languages.findIndex(l => l.code === (globalLang || 'hi'))
  );
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [headlineFade, setHeadlineFade] = useState(true);
  const [activeHeadline, setActiveHeadline] = useState(LANG_HEADLINES['hi'] || DEFAULT_HEADLINE);

  // React to language change — fade headline and update
  useEffect(() => {
    const langCode = languages[selectedLangIndex]?.code || 'hi';
    const newHeadline = LANG_HEADLINES[langCode] || DEFAULT_HEADLINE;
    if (JSON.stringify(newHeadline) === JSON.stringify(activeHeadline)) return;
    setHeadlineFade(false);
    const timer = setTimeout(() => {
      setActiveHeadline(newHeadline);
      setHeadlineFade(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedLangIndex]);

  const handleLanguageSelect = (lang, index) => {
    setSelectedLangIndex(index);
    setLangDropdownOpen(false);
    setGlobalLang(lang.code);
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
      {/* ── HEADER ── */}
      <header className="vaani-header">
        <VaaniLogo size={22} />

        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="btn btn-secondary btn-sm"
            >
              {languages[selectedLangIndex]?.nativeName || 'हिन्दी'} ▾
            </button>
            {langDropdownOpen && (
              <div className="lang-dropdown">
                {languages.map((lang, i) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang, i)}
                    className="w-full text-left"
                    style={{
                      width: '100%', textAlign: 'left',
                      background: i === selectedLangIndex ? 'var(--primary-muted)' : 'transparent',
                      border: 'none', color: i === selectedLangIndex ? 'var(--primary)' : 'var(--text-primary)',
                      padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '13px', transition: 'background 0.15s',
                    }}
                  >
                    {lang.nativeName} — {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/auth')}
            className="btn btn-secondary btn-sm"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        className="hero-gradient"
        style={{
          minHeight: '100dvh',
          display: 'flex', alignItems: 'center',
          padding: '80px var(--sp-6) var(--sp-16)',
        }}
      >
        <div
          className="mx-auto flex items-center justify-between gap-12"
          style={{ maxWidth: '1100px', width: '100%' }}
        >
          {/* Left: headline */}
          <div style={{ flex: 1, maxWidth: '520px' }}>
            <div style={{ opacity: headlineFade ? 1 : 0, transition: 'opacity 150ms ease' }}>
              <h1
                className="font-extrabold leading-tight animate-fadeUp"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: '#fff', marginBottom: '4px', fontFamily: 'var(--font-display)' }}
              >
                {activeHeadline.line1}
              </h1>
              <h1
                className="font-extrabold leading-tight animate-fadeUp"
                style={{
                  fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                  background: 'linear-gradient(135deg, #00D4AA, #10B981)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text', marginBottom: '16px',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {activeHeadline.line2}
              </h1>
              <p
                className="animate-fadeUp delay-200"
                style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: 1.6, marginBottom: '28px' }}
              >
                {activeHeadline.sub}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap mb-5 animate-fadeUp delay-300">
              <button onClick={onStart} className="btn btn-orange btn-lg">
                Try VAANI Free
              </button>
              <button className="btn btn-secondary btn-lg">
                Watch Demo
              </button>
            </div>

            <p className="animate-fadeUp delay-400" style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              No signup needed · 22 languages · 100% free
            </p>
          </div>

          {/* Right: phone mockup */}
          <div className="hidden lg:block" style={{ flexShrink: 0 }}>
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: 'var(--sp-20) var(--sp-6)', background: '#0A0A0A' }}>
        <h2 className="text-center font-bold animate-fadeUp" style={{ fontSize: '2rem', marginBottom: '8px' }}>
          Built for Bharat
        </h2>
        <p className="text-center animate-fadeUp delay-100" style={{ color: 'var(--text-secondary)', marginBottom: '48px' }}>
          Not a bank. Not a broker. Your village's financial advisor.
        </p>
        <div className="mx-auto" style={{ maxWidth: '900px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="card hover-lift animate-fadeUp"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div style={{ fontSize: '32px', marginBottom: '14px' }}>{f.icon}</div>
              <h3 className="font-semibold mb-2" style={{ fontSize: '15px' }}>{f.title}</h3>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              <p className="text-xs italic" style={{ color: 'var(--orange)' }}>{f.quote}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="stats-band">
        <div className="mx-auto flex justify-around flex-wrap gap-8" style={{ maxWidth: '900px' }}>
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-extrabold" style={{ fontSize: '3rem', color: '#fff', lineHeight: 1 }}>{s.value}</div>
              <div className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.8)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: 'var(--sp-10) var(--sp-6)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="mx-auto flex items-center justify-between flex-wrap gap-4" style={{ maxWidth: '900px' }}>
          <VaaniLogo size={20} />
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map(link => (
              <a key={link} href="#" style={{ color: 'var(--text-tertiary)', fontSize: '13px', textDecoration: 'none' }}>
                {link}
              </a>
            ))}
          </div>
        </div>
        <p className="text-center mt-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Made for Bharat 🇮🇳 · VAANI is not a bank or financial advisor. We provide information only.
        </p>
      </footer>
    </div>
  );
}