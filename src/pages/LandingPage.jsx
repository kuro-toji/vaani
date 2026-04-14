import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { languages } from '../data/languages.js';
import { getRegionByPincode } from '../services/pincodeService.js';
import { useLandingVoice } from '../hooks/useLandingVoice.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { extractDigitsFromText } from '../data/indianDigitMap.js';

/* ─── SVG Waveform Logo ─── */
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
        aria-hidden="true"
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

/* ─── Wave / Color Constants ─── */
const LANG_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#A855F7',
  '#E11D48', '#0EA5E9',
];
const WAVE_HEIGHTS = [8, 12, 18, 22, 18, 12, 8];
const WAVE_DELAYS = [0, 0.1, 0.2, 0.3, 0.2, 0.1, 0];

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
  raj: { line1: 'थांकी आवाज।', line2: 'थांकी भाषा।', sub: 'भारत रो पहलो वॉइस-फर्स्ट वित्तीय सलाहकार' },
  ne: { line1: 'तपाईंको आवाज।', line2: 'तपाईंको भाषा।', sub: 'भारतको पहिलो भ्वाइस-फर्स्ट वित्तीय सल्लाहकार' },
  ks: { line1: 'تۄہۍ آواز۔', line2: 'تۄہۍ زبان۔', sub: 'ہِنۡدوستانۡ ہُند پَتَھر وائس-فَرسۡٹ مالی مَددگار' },
  sd: { line1: 'توهان جي آواز۔', line2: 'توهان جي ٻولي۔', sub: 'هندستان جو پهريون وائس-فرسٽ مالي مددگار' },
};

const HOW_STEPS = [
  { num: 1, emoji: '🎤', title: 'Speak Your Query', desc: 'Just tap the mic and say what you need. No typing, no forms.' },
  { num: 2, emoji: '🤖', title: 'AI Understands', desc: 'Vaani listens in your language and understands your intent.' },
  { num: 3, emoji: '💡', title: 'Get Answers', desc: 'Get instant, clear answers and guidance. No jargon.' },
];

const TRUST_CARDS = [
  { emoji: '🏦', title: 'Trusted by Banks', desc: 'Used by leading banks and NBFCs for secure, voice-first onboarding.' },
  { emoji: '🔒', title: 'Privacy First', desc: 'Your voice and data are never stored. 100% privacy by design.' },
  { emoji: '🌐', title: '22 Languages', desc: 'Vaani understands all major Indian languages and dialects.' },
];

const A11Y_CARDS = [
  { emoji: '👁️', title: 'Blind Users', desc: 'Auto-reads all responses aloud. Complete voice-in, voice-out experience. No screen needed.' },
  { emoji: '👂', title: 'Hearing Impaired', desc: 'All responses shown as large readable text. Icon-based shortcuts for common questions.' },
  { emoji: '🤝', title: 'Motor Impaired', desc: 'Full-screen tap mode — tap ANYWHERE on screen to speak. No small buttons.' },
  { emoji: '🧠', title: 'Simple Mode', desc: 'Traffic light UI (Green/Yellow/Red) — no charts, no numbers, just peace of mind.' },
  { emoji: '👴', title: 'Elderly Users', desc: "Large text mode, slow speech, simple words. Ask 'What is FD?' and get a story, not a chart." },
  { emoji: '📖', title: 'Low Literacy', desc: 'Visual icon cards — tap a picture to get financial advice. No typing or reading needed.' },
];

/* ─── Water Drop Transition ─────────────────────────────── */
function WaterDropTransition({ isActive, children }) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'expand' | 'peak' | 'collapse'
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    // Start expand
    setPhase('expand');

    // At peak coverage (~450ms) — it's fully grown
    timerRef.current = setTimeout(() => {
      setPhase('peak');
      
      // Start collapse
      timerRef.current = setTimeout(() => {
        setPhase('collapse');

        // Done
        timerRef.current = setTimeout(() => {
          setPhase('idle');
        }, 700);
      }, 50);

    }, 450);

    return () => clearTimeout(timerRef.current);
  }, [isActive]);

  if (!isActive && phase === 'idle') return <>{children}</>;

  return (
    <>
      <style>{`
        .water-drop-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .water-drop-ripple {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 212, 170, 0.6) 0%, rgba(16, 185, 129, 0.3) 60%, transparent 100%);
          transform: scale(0);
          transition: none;
        }

        .water-drop-ripple.animating {
          animation: waterDropExpand 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .water-drop-ripple.collapsing {
          animation: waterDropCollapse 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes waterDropExpand {
          0%   { transform: scale(0); opacity: 0.9; }
          100% { transform: scale(300); opacity: 0; }
        }

        @keyframes waterDropCollapse {
          0%   { transform: scale(300); opacity: 0; }
          100% { transform: scale(0); opacity: 0; }
        }
      `}</style>
      {children}
      {phase !== 'idle' && (
        <div className="water-drop-overlay" aria-hidden="true">
          <div
            className={`water-drop-ripple ${phase === 'expand' ? 'animating' : phase === 'collapse' ? 'collapsing' : ''}`}
          />
        </div>
      )}
    </>
  );
}

export default function LandingPage({ onStart }) {
  const [pincode, setPincode] = useState('');
  const [region, setRegion] = useState(null);
  const [detectedLang, setDetectedLang] = useState('हिन्दी');
  const [selectedLangIndex, setSelectedLangIndex] = useState(0);
  const [isPincodeListening, setIsPincodeListening] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [headlineAnim, setHeadlineAnim] = useState('idle'); // 'idle' | 'out' | 'in'
  const [activeHeadline, setActiveHeadline] = useState(DEFAULT_HEADLINE);
  const [nextHeadline, setNextHeadline] = useState(null);
  const [waterDropKey, setWaterDropKey] = useState(0);
  const [headlineFade, setHeadlineFade] = useState(true);
  const pincodeInputRef = useRef(null);
  const audioRef = useRef(null);
  const [welcomePlayed, setWelcomePlayed] = useState(false);

  const { isListening, startListening, stopListening } = useLandingVoice();
  const { language, setLanguage: setGlobalLanguage } = useLanguage();
  const currentLangCode = languages[selectedLangIndex]?.code || 'hi';

  // Play pre-recorded welcome audio
  const playWelcomeAudio = useCallback((lang) => {
    const langCode = lang?.code || currentLangCode || 'hi';
    const isHindi = langCode === 'hi' || langCode === 'mr' || langCode === 'bn' || langCode === 'pa' || langCode === 'gu' || langCode === 'kn' || langCode === 'ml' || langCode === 'ta' || langCode === 'te' || langCode === 'or' || langCode === 'as';
    const audioFile = isHindi ? '/audio/welcome_hi.mp3' : '/audio/welcome_en.mp3';
    
    const audio = new Audio(audioFile);
    audioRef.current = audio;
    
    audio.onended = () => setWelcomePlayed(true);
    audio.onerror = () => setWelcomePlayed(true); // If audio fails, continue anyway
    
    audio.play().catch(() => setWelcomePlayed(true));
  }, [currentLangCode]);

  // Play welcome audio on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      playWelcomeAudio(languages[selectedLangIndex]);
    }, 800);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Responsive check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Detect region from pincode
  useEffect(() => {
    if (pincode.length === 6) {
      let cancelled = false;
      setPincodeLoading(true);
      getRegionByPincode(pincode).then(data => {
        if (cancelled) return;
        setPincodeLoading(false);
        if (data) {
          setRegion(data);
          setDetectedLang(data.languageName || data.language);
          const langIndex = languages.findIndex(l => l.code === data.language);
          if (langIndex !== -1) setSelectedLangIndex(langIndex);
          try { sessionStorage.setItem('vaani_detected_language', data.language); } catch {}
          try { localStorage.setItem('vaani_language', data.language); } catch {}
          try { localStorage.setItem('vaani_pincode', pincode); } catch {}
          setGlobalLanguage(data.language);
        }
      }).catch(() => { if (!cancelled) setPincodeLoading(false); });
      return () => { cancelled = true; };
    } else {
      setRegion(null);
    }
  }, [pincode]);

  // ── Language change headline animation ─────────────────────────────
  useEffect(() => {
    const langCode = languages[selectedLangIndex]?.code || 'hi';
    const newHeadline = LANG_HEADLINES[langCode] || DEFAULT_HEADLINE;
    if (JSON.stringify(newHeadline) === JSON.stringify(activeHeadline)) return;

    setHeadlineAnim('out');
    setNextHeadline(newHeadline);

    const timer = setTimeout(() => {
      setActiveHeadline(newHeadline);
      setHeadlineAnim('in');
      const timer2 = setTimeout(() => setHeadlineAnim('idle'), 600);
      return () => clearTimeout(timer2);
    }, 350);
    return () => clearTimeout(timer);
  }, [selectedLangIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger water drop on language change
  useEffect(() => {
    if (selectedLangIndex === 0) return; // Skip on initial render
    // Fire water drop — set a new key forces re-render with isActive=true
    setWaterDropKey(prev => prev + 1);
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setHeadlineFade(false);
    const t = setTimeout(() => setHeadlineFade(true), 150);
    return () => clearTimeout(t);
  }, [language]);

  // Play pre-recorded pincode prompt audio after language selection
  const playPincodeAudio = useCallback((langCode) => {
    const isHindi = langCode === 'hi' || langCode === 'mr' || langCode === 'bn' || langCode === 'pa' || langCode === 'gu' || langCode === 'kn' || langCode === 'ml' || langCode === 'ta' || langCode === 'te' || langCode === 'or' || langCode === 'as';
    const audioFile = isHindi ? '/audio/ask_pincode_hi.mp3' : '/audio/ask_pincode_en.mp3';
    
    const audio = new Audio(audioFile);
    audio.play().catch(() => {});
  }, []);

  const handleLanguageSelect = (lang, index) => {
    setSelectedLangIndex(index);
    setDetectedLang(lang.name);
    try { sessionStorage.setItem('vaani_detected_language', lang.code); } catch {}
    try { localStorage.setItem('vaani_language', lang.code); } catch {}
    setGlobalLanguage(lang.code);
    playPincodeAudio(lang.code);
  };

  const handleVoicePincode = useCallback(() => {
    if (isListening) {
      stopListening();
      setIsPincodeListening(false);
      return;
    }
    setIsPincodeListening(true);
    startListening((transcript, detectedLangCode) => {
      // If STT auto-detected a language, quickly switch the UI to it
      if (detectedLangCode && detectedLangCode !== currentLangCode) {
        const matchedLang = languages.find(l => l.code === detectedLangCode || l.code.startsWith(detectedLangCode));
        if (matchedLang) {
          const index = languages.indexOf(matchedLang);
          handleLanguageSelect(matchedLang, index);
        }
      }

      const digits = extractDigitsFromText(transcript);
      if (digits.length > 0) setPincode(digits.slice(0, 6));
    }, currentLangCode);
  }, [isListening, startListening, stopListening, currentLangCode]);

  useEffect(() => {
    if (!isListening) setIsPincodeListening(false);
  }, [isListening]);

  const scrollToA11y = () => {
    document.getElementById('accessibility')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <WaterDropTransition isActive={waterDropKey > 0}>
      <div role="main" className="vaani-landing" style={{
        backgroundColor: '#0F172A',
        color: '#ffffff',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      }}>
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes orbGlow { 0%,100%{box-shadow:0 0 40px rgba(16,185,129,0.3),0 20px 60px rgba(0,0,0,0.5)} 50%{box-shadow:0 0 80px rgba(0,212,170,0.5),0 20px 80px rgba(0,0,0,0.4)} }
        @keyframes wave { 0%,100%{transform:scaleY(0.4)} 50%{transform:scaleY(1)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.05)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes bubbleOut { 
          0% { opacity:1; transform:scale(1); } 
          100% { opacity:0; transform:scale(1.15); } 
        }
        @keyframes bubbleIn { 
          0% { opacity:0; transform:scale(0.75); } 
          60% { transform:scale(1.05); } 
          100% { opacity:1; transform:scale(1); } 
        }
        input::placeholder { color: rgba(255,255,255,0.35) !important; }
      `}</style>

      {/* ══════════════════════════════════════
          SECTION 1 — FIXED HEADER
          ══════════════════════════════════════ */}
      <header role="banner" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          maxWidth: '72rem', margin: '0 auto', padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <VaaniLogo size={24} />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={scrollToA11y}
              style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', padding: '8px 16px', borderRadius: '999px',
                fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >♿ Accessibility</button>
            <button
              onClick={onStart}
              style={{
                background: 'linear-gradient(135deg,#0F6E56,#1D9E75)', border: 'none',
                color: '#fff', padding: '8px 20px', borderRadius: '999px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >Open Dashboard →</button>
          </div>
        </div>
      </header>

      <div style={{ 
        position: 'absolute', top: '70px', left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 0', fontSize: '12px', color: 'rgba(255,255,255,0.35)', zIndex: 10
      }}>
        <span style={{ color: '#10B981', fontWeight: 500 }}>Home</span>
        <span>→</span>
        <span>Dashboard</span>
        <span>→</span>
        <span>Chat with Vaani</span>
      </div>

      {/* ══════════════════════════════════════
          SECTION 2 — HERO
          ══════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 60px', textAlign: 'center',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '999px', padding: '6px 16px', fontSize: '13px',
          color: '#10B981', marginBottom: '24px',
          animation: 'fadeUp 0.6s ease both',
        }}>🇮🇳 Built for India's Next 800 Million</div>

        {/* Headline */}
        <div style={{ opacity: headlineFade ? 1 : 0, transition: 'opacity 0.15s ease' }}>
          <h2 style={{
            fontSize: 'clamp(42px,8vw,80px)',
            fontWeight: 800,
            lineHeight: 1.05,
            margin: 0,
            color: '#ffffff',
            animationName: headlineAnim === 'out' ? 'bubbleOut' :
                           headlineAnim === 'in'  ? 'bubbleIn'  : 'fadeUp',
            animationDuration: headlineAnim === 'in' ? '0.5s' : '0.6s',
            animationTimingFunction: headlineAnim === 'in'
              ? 'cubic-bezier(0.34,1.56,0.64,1)'
              : headlineAnim === 'out' ? 'ease' : 'ease',
            animationDelay: headlineAnim === 'idle' ? '0.1s' : '0s',
            animationFillMode: 'both',
            animationIterationCount: 1,
            transformOrigin: 'center center',
          }}>
            {activeHeadline.line1}
          </h2>
          <h2 style={{
            fontSize: 'clamp(42px,8vw,80px)',
            fontWeight: 800,
            lineHeight: 1.05,
            margin: 0,
            background: 'linear-gradient(135deg,#00D4AA,#10B981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animationName: headlineAnim === 'out' ? 'bubbleOut' :
                           headlineAnim === 'in'  ? 'bubbleIn'  : 'fadeUp',
            animationDuration: headlineAnim === 'in' ? '0.5s' : '0.6s',
            animationTimingFunction: headlineAnim === 'in'
              ? 'cubic-bezier(0.34,1.56,0.64,1)'
              : 'ease',
            animationDelay: headlineAnim === 'in' ? '0.07s'
                          : headlineAnim === 'idle' ? '0.2s' : '0s',
            animationFillMode: 'both',
            animationIterationCount: 1,
            transformOrigin: 'center center',
          }}>
            {activeHeadline.line2}
          </h2>

          {/* Subheadline */}
          <p style={{
            fontSize: 'clamp(16px,2.5vw,20px)', color: 'rgba(255,255,255,0.6)',
            maxWidth: '520px', margin: '20px auto 0', lineHeight: 1.6,
            animation: 'fadeUp 0.6s ease both', animationDelay: '0.3s', animationFillMode: 'both',
          }}>{activeHeadline.sub}</p>
        </div>

        {/* ── Siri Orb ── */}
        <div
          role="button" tabIndex={0} aria-label="Tap to start speaking"
          onClick={onStart}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onStart(); }}
          style={{
            position: 'relative', width: '200px', height: '200px',
            margin: '48px auto 0', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            animation: 'fadeUp 0.6s ease both', animationDelay: '0.4s', animationFillMode: 'both',
          }}
        >
          {/* Outer glow */}
          <div style={{
            position: 'absolute', inset: '-20px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,212,170,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          {/* Outer ring */}
          <div style={{
            position: 'absolute', inset: '-4px', borderRadius: '50%',
            border: '1px solid rgba(0,212,170,0.25)',
            animation: 'pulse 3s ease-in-out infinite', pointerEvents: 'none',
          }} />
          {/* Main orb */}
          <div style={{
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #1D9E75, #0F6E56 55%, #052e1a)',
            animation: 'orbFloat 4s ease-in-out infinite, orbGlow 3s ease-in-out infinite',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Glass highlight */}
            <div style={{
              position: 'absolute', top: '20%', left: '22%',
              width: '28%', height: '22%', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', filter: 'blur(6px)',
              pointerEvents: 'none',
            }} />
            <Mic size={56} color="#ffffff" style={{ opacity: 0.95, position: 'relative', zIndex: 1 }} />
          </div>
        </div>

        {/* Wave bars */}
        <div style={{
          display: 'flex', gap: '4px', alignItems: 'center',
          justifyContent: 'center', marginTop: '24px',
        }}>
          {WAVE_HEIGHTS.map((h, i) => (
            <div key={i} style={{
              width: '3px', height: `${h}px`, borderRadius: '3px',
              background: 'linear-gradient(180deg,#00D4AA,#10B981)',
              animation: `wave 0.9s ease-in-out infinite`,
              animationDelay: `${WAVE_DELAYS[i]}s`,
            }} />
          ))}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '12px', letterSpacing: '0.3px' }}>
          See Your Dashboard →
        </p>

        {/* ── Pincode ── */}
        <div style={{
          marginTop: '40px',
          animation: 'fadeUp 0.6s ease both', animationDelay: '0.5s', animationFillMode: 'both',
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '10px',
            textTransform: 'uppercase', letterSpacing: '1px',
          }}>Where are you from? (Optional)</p>
          <div style={{ maxWidth: '360px', margin: '0 auto', display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
              <input
                id="pincode-input" ref={pincodeInputRef}
                type="text" inputMode="numeric" value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="110001" maxLength={6}
                style={{
                  flex: 1, padding: '14px 48px 14px 18px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '16px', color: '#ffffff', fontSize: '16px',
                  outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,212,170,0.7)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
              />
              <button
                type="button" onClick={handleVoicePincode}
                aria-label={isPincodeListening ? 'Stop voice input' : 'Speak your pincode'}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  background: isPincodeListening ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.3)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                  animation: isPincodeListening ? 'pulse 1.2s infinite' : 'none',
                }}
              ><Mic size={16} /></button>
            </div>
            {region && (
              <div style={{
                padding: '14px 16px',
                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '16px', color: '#10B981', fontSize: '13px', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center',
              }}>{region.region}{region.state ? `, ${region.state}` : ''}</div>
            )}
          </div>
          {isPincodeListening && (
            <p style={{ color: '#F59E0B', fontSize: '13px', marginTop: '8px', animation: 'pulse 1s infinite' }}>
              🎤 Listening… speak your pincode
            </p>
          )}
          {region && (
            <p style={{ color: '#00D4AA', fontSize: '13px', marginTop: '8px' }}>
              🎯 Language detected: {region.languageName || region.language}
            </p>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 3 — HOW IT WORKS
          ══════════════════════════════════════ */}
      <section style={{
        background: 'rgba(255,255,255,0.03)', padding: '80px 24px',
      }}>
        <h3 style={{ color: '#ffffff', fontSize: '32px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>How Vaani Works</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '48px', fontSize: '16px' }}>
          No reading required. No forms. No bank jargon.
        </p>
        <div style={{
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          gap: '16px', maxWidth: '900px', margin: '0 auto', alignItems: 'stretch',
        }}>
          {HOW_STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', flex: 1, gap: isMobile ? '0' : '16px' }}>
              <div style={{
                flex: 1, textAlign: 'center', padding: '32px 24px',
                background: 'rgba(255,255,255,0.04)', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 16px',
                  background: 'rgba(16,185,129,0.2)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#10B981', fontSize: '28px', fontWeight: 800,
                }}>{step.num}</div>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>{step.emoji}</div>
                <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>{step.title}</h4>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
              {/* Arrow between steps (desktop only) */}
              {!isMobile && i < HOW_STEPS.length - 1 && (
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '32px', alignSelf: 'center', flexShrink: 0 }}>→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 4 — TRUST SIGNALS
          ══════════════════════════════════════ */}
      <section style={{ padding: '60px 24px' }}>
        <h3 style={{ color: '#ffffff', fontSize: '28px', fontWeight: 700, textAlign: 'center', marginBottom: '32px' }}>Why Trust Vaani?</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '16px', maxWidth: '720px', margin: '0 auto',
        }}>
          {TRUST_CARDS.map((card, i) => (
            <div key={i} style={{
              padding: '24px', background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{card.emoji}</div>
              <h4 style={{ color: '#ffffff', fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>{card.title}</h4>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.6 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 5 — ALL 28 LANGUAGES
          ══════════════════════════════════════ */}
      <section role="region" aria-label="Choose your language" style={{
        background: 'rgba(255,255,255,0.02)', padding: '60px 24px',
      }}>
        <h3 style={{ color: '#ffffff', fontSize: '28px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>28 Indian Languages</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '32px', fontSize: '15px' }}>
          Tap your language to get started in your own script
        </p>
        <div role="radiogroup" aria-label="Select your language" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '10px', maxWidth: '720px', margin: '0 auto',
        }}>
          {languages.map((lang, index) => {
            const isSelected = selectedLangIndex === index;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang, index)}
                tabIndex={0}
                role="radio"
                aria-pressed={isSelected}
                aria-label={`${lang.name}${lang.nativeName ? ' - ' + lang.nativeName : ''}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLanguageSelect(lang, index); } }}
                style={{
                  padding: '16px 8px', borderRadius: '14px', textAlign: 'center',
                  border: isSelected ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: isSelected ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  color: '#ffffff',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }
                }}
              >
                <div style={{
                  fontSize: '18px', fontWeight: 600, marginBottom: '4px',
                  color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.9)',
                }}>
                  {lang.nativeName || lang.name}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: isSelected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)',
                }}>{lang.name}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 6 — ACCESSIBILITY
          ══════════════════════════════════════ */}
      <section id="accessibility" role="region" aria-label="Accessibility features" style={{
        background: 'rgba(0,212,170,0.05)',
        borderTop: '1px solid rgba(0,212,170,0.1)',
        borderBottom: '1px solid rgba(0,212,170,0.1)',
        padding: '60px 24px',
      }}>
        <h3 style={{ color: '#00D4AA', fontSize: '28px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>♿ Accessibility Features</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '40px', fontSize: '15px' }}>
          Built for blind, deaf, elderly, and specially-abled users
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '16px', maxWidth: '900px', margin: '0 auto',
        }}>
          {A11Y_CARDS.map((card, i) => (
            <div key={i} style={{
              padding: '20px', background: 'rgba(255,255,255,0.04)',
              borderRadius: '16px', border: '1px solid rgba(0,212,170,0.15)',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>{card.emoji}</div>
              <h4 style={{ color: '#ffffff', fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>{card.title}</h4>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.6 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 7 — FINAL CTA
          ══════════════════════════════════════ */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h3 style={{ color: '#ffffff', fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>Ready to talk to Vaani?</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px', fontSize: '16px' }}>
          Free forever. No sign-up. No bank details. Just speak.
        </p>
        <button
          onClick={onStart}
          style={{
            padding: '20px 60px',
            background: 'linear-gradient(135deg,#0F6E56,#1D9E75)',
            border: 'none', borderRadius: '999px', color: '#ffffff',
            fontSize: '20px', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 8px 40px rgba(16,185,129,0.4)',
            letterSpacing: '0.3px', transition: 'all 0.3s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 12px 48px rgba(16,185,129,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(16,185,129,0.4)'; }}
        >Go to Dashboard →</button>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '12px' }}>
          Available in 28 Indian Languages
        </p>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: '32px 24px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <VaaniLogo size={20} />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>VAANI © 2026 • Made for Bharat</span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>Not a bank. Not financial advice.</span>
      </footer>
    </div>
    </WaterDropTransition>
  );
}
