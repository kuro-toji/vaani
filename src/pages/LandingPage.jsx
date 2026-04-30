import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { languages } from '../data/languages.js';
import { useLanguage } from '../context/LanguageContext.jsx';

const LANG_HEADLINES = {
  hi: { line1: 'आपकी आवाज़,', line2: 'आपकी भाषा।', sub: 'भारत का पहला वॉइस-फर्स्ट वित्तीय सलाहकार' },
  bn: { line1: 'আপনার কণ্ঠস্বর,', line2: 'আপনার ভাষা।', sub: 'ভারতের প্রথম ভয়েস-ফার্স্ট আর্থিক উপদেষ্টা' },
  te: { line1: 'మీ స్వరం,', line2: 'మీ భాష।', sub: 'భారతదేశ మొదటి వాయిస్-ఫర్స్ట్ ఆర్థిక సలహాదారు' },
  ta: { line1: 'உங்கள் குரல்,', line2: 'உங்கள் மொழி।', sub: 'இந்தியாவின் முதல் குரல்-முதல் நிதி ஆலோசகர்' },
  en: { line1: 'Your Voice,', line2: 'Your Language.', sub: "India's first voice-first financial advisor" },
  mr: { line1: 'तुमचा आवाज,', line2: 'तुमची भाषा।', sub: 'भारताचा पहिला व्हॉइस-फर्स्ट आर्थिक सल्लागार' },
  gu: { line1: 'તમારો અવાજ,', line2: 'તમારી ભાષા।', sub: 'ભારતનો પ્રથમ વૉઇસ-ફર્સ્ટ નાણાકીય સલાહકાર' },
  pa: { line1: 'ਤੁਹਾਡੀ ਆਵਾਜ਼,', line2: 'ਤੁਹਾਡੀ ਭਾਸ਼ਾ।', sub: 'ਭਾਰਤ ਦਾ ਪਹਿਲਾ ਵੌਇਸ-ਫਸਟ ਵਿੱਤੀ ਸਲਾਹਕਾਰ' },
  ur: { line1: 'آپ کی آواز،', line2: 'آپ کی زبان۔', sub: 'ہندوستان کا پہلا وائس فرسٹ مالی مددگار' },
};
const DEFAULT_HL = { line1: 'Your Voice,', line2: 'Your Language.', sub: "India's first voice-first financial advisor" };

const FEATURES = [
  { icon: '🗣️', num: '01', title: '22 Languages', body: 'Bhojpuri, Awadhi, Maithili — speak however your village speaks. No English required.' },
  { icon: '🏦', num: '02', title: 'FD Ladder Optimizer', body: 'Split savings across banks for maximum interest. Auto TDS harvesting + maturity alerts.' },
  { icon: '💍', num: '03', title: 'Life-Event Prediction', body: 'Detects wedding, harvest, or education signals from chat. Aligns FD maturity to your event.' },
  { icon: '📊', num: '04', title: 'Portfolio Tracker', body: 'FDs, SIPs, crypto wallets, bank accounts — one dashboard in your language.' },
  { icon: '🧠', num: '05', title: 'Emotional Finance AI', body: 'Detects anxiety in your words. Switches to village-level analogies to calm you.' },
  { icon: '🌍', num: '06', title: 'Hyperlocal Trust', body: "Your city's numbers, not national averages. Thousands from your area already trust VAANI." },
];

const STATS = [
  { num: '500M', sup: '+', label: 'Rural Indians Underserved' },
  { num: '22', sup: '', label: 'Languages Supported' },
  { num: '₹10K', sup: '', label: 'Minimum to Start' },
  { num: '100', sup: '%', label: 'Free Forever' },
];

const MARQUEE_ITEMS = [
  'FD Rate Comparison', 'SIP Tracking', 'Crypto Wallets', 'Tax Intelligence',
  'Idle Money Detection', 'Freelancer OS', 'Credit Intelligence', 'Voice Commands',
  'Government Schemes', 'Portfolio Analytics', 'Expense Tracking', 'FIRE Calculator',
];

export default function LandingPage({ onStart }) {
  const navigate = useNavigate();
  const { language: globalLang, setLanguage: setGlobalLang } = useLanguage();
  const [selectedLangIndex, setSelectedLangIndex] = useState(
    () => languages.findIndex(l => l.code === (globalLang || 'hi'))
  );
  const [langOpen, setLangOpen] = useState(false);
  const [headlineFade, setHeadlineFade] = useState(true);
  const [activeHL, setActiveHL] = useState(LANG_HEADLINES[globalLang] || LANG_HEADLINES['hi']);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const code = languages[selectedLangIndex]?.code || 'hi';
    const hl = LANG_HEADLINES[code] || DEFAULT_HL;
    if (JSON.stringify(hl) === JSON.stringify(activeHL)) return;
    setHeadlineFade(false);
    const t = setTimeout(() => { setActiveHL(hl); setHeadlineFade(true); }, 180);
    return () => clearTimeout(t);
  }, [selectedLangIndex]);

  const selectLang = (lang, i) => {
    setSelectedLangIndex(i);
    setLangOpen(false);
    setGlobalLang(lang.code);
  };

  const goToDashboard = () => {
    if (onStart) onStart();
    navigate('/app');
  };

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>

      {/* ─── NAV ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 48px', background: 'linear-gradient(to bottom, rgba(12,12,14,0.95), transparent)',
      }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 300, letterSpacing: '0.12em' }}>
          VA<span style={{ color: 'var(--gold)' }}>A</span>NI
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setLangOpen(!langOpen)} className="btn-outline" style={{ padding: '8px 16px', fontSize: '11px' }}>
              {languages[selectedLangIndex]?.nativeName || 'हिन्दी'} ▾
            </button>
            {langOpen && (
              <div className="lang-dropdown" style={{ maxHeight: '250px' }}>
                {languages.map((lang, i) => (
                  <button key={lang.code} onClick={() => selectLang(lang, i)} style={{
                    width: '100%', textAlign: 'left', background: i === selectedLangIndex ? 'var(--gold-dim)' : 'transparent',
                    border: 'none', color: i === selectedLangIndex ? 'var(--gold)' : 'var(--text-primary)',
                    padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                  }}>
                    {lang.nativeName} — {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => navigate('/auth')} className="btn-outline" style={{ padding: '8px 20px' }}>Sign In</button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{
        position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: '0 60px 100px', overflow: 'hidden',
      }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 80% 60% at 70% 30%, #1C1508 0%, var(--ink) 70%)' }} />

        {/* Orbs */}
        <div style={{
          position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)',
          filter: 'blur(80px)', top: '-100px', right: '100px', zIndex: 1,
          animation: 'orbDrift 12s ease-in-out infinite alternate',
        }} />
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29,158,117,0.10) 0%, transparent 70%)',
          filter: 'blur(80px)', bottom: '150px', right: '350px', zIndex: 1,
          animation: 'orbDrift 9s ease-in-out infinite alternate-reverse',
        }} />

        {/* Diagonal rule */}
        <div style={{
          position: 'absolute', top: 0, right: '200px', width: '1px', height: '100vh', zIndex: 2,
          background: 'linear-gradient(to bottom, transparent 0%, var(--gold) 40%, var(--gold) 60%, transparent 100%)',
          opacity: 0.15, transform: 'rotate(15deg)', transformOrigin: 'top center',
        }} />

        {/* Floating stat cards */}
        <div style={{
          position: 'absolute', top: '22%', right: '7%', zIndex: 4, background: 'var(--glass-bg)',
          border: '1px solid var(--line)', backdropFilter: 'blur(12px)', padding: '22px 28px',
          animation: 'floatBob 6s ease-in-out infinite',
        }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 300, color: 'var(--gold)', lineHeight: 1 }}>22+</div>
          <div style={{ fontSize: '10px', fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginTop: '6px' }}>Languages Supported</div>
        </div>
        <div style={{
          position: 'absolute', top: '52%', right: '5%', zIndex: 4, background: 'var(--glass-bg)',
          border: '1px solid var(--line)', backdropFilter: 'blur(12px)', padding: '22px 28px',
          animation: 'floatBob 6s ease-in-out infinite', animationDelay: '-3s',
        }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 300, color: 'var(--primary)', lineHeight: 1 }}>100%</div>
          <div style={{ fontSize: '10px', fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginTop: '6px' }}>Free Forever</div>
        </div>

        {/* Eyebrow */}
        <div style={{
          position: 'relative', zIndex: 3, fontSize: '10px', fontWeight: 400,
          letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--gold)',
          marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px',
          animation: 'fadeUp 1s 0.2s both',
        }}>
          <span style={{ display: 'block', width: '40px', height: '1px', background: 'var(--gold)' }} />
          Made for Bharat 🇮🇳
        </div>

        {/* Headline */}
        <div style={{ opacity: headlineFade ? 1 : 0, transition: 'opacity 180ms ease' }}>
          <h1 style={{
            position: 'relative', zIndex: 3, fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(48px, 7vw, 96px)', fontWeight: 300, lineHeight: 1.0,
            letterSpacing: '-0.01em', maxWidth: '800px',
            animation: 'fadeUp 1s 0.4s both',
          }}>
            {activeHL.line1}<br />
            <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>{activeHL.line2}</em>
          </h1>
        </div>

        <p style={{
          position: 'relative', zIndex: 3, fontSize: '14px', fontWeight: 300,
          lineHeight: 1.9, color: 'var(--text-secondary)', maxWidth: '440px', marginTop: '24px',
          animation: 'fadeUp 1s 0.6s both',
        }}>
          {activeHL.sub}. No forms, no typing, no English required. Speak and discover government schemes, compare FD rates, track your portfolio.
        </p>

        {/* CTAs */}
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: '24px', marginTop: '40px', animation: 'fadeUp 1s 0.8s both' }}>
          <button onClick={goToDashboard} className="btn-gold btn-lg">Enter Dashboard</button>
          <button onClick={() => navigate('/auth')} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Sign In <span style={{ fontSize: '14px' }}>→</span>
          </button>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          animation: 'fadeUp 1s 1.2s both',
        }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Scroll</div>
          <div style={{ width: '1px', height: '50px', background: 'linear-gradient(to bottom, var(--gold), transparent)', animation: 'scrollPulse 2s ease-in-out infinite' }} />
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <div style={{ background: 'var(--gold)', padding: '14px 0', overflow: 'hidden', display: 'flex' }}>
        <div style={{ display: 'flex', gap: '60px', whiteSpace: 'nowrap', animation: 'marquee 30s linear infinite' }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} style={{
              fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              {item} <span style={{ fontSize: '7px', color: 'rgba(12,12,14,0.4)' }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── FEATURES ─── */}
      <section style={{ padding: '120px 60px', background: 'var(--ink)' }}>
        <div className="reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '64px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <span style={{ width: '28px', height: '1px', background: 'var(--gold)', display: 'block' }} />
              Built for Bharat
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4.5vw, 60px)', fontWeight: 300, lineHeight: 1.1 }}>
              Our <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>features</em>
            </h2>
          </div>
          <p style={{ fontSize: '13px', fontWeight: 300, lineHeight: 1.8, color: 'var(--text-secondary)', maxWidth: '280px', textAlign: 'right' }}>
            Voice-first financial tools crafted for every Indian household.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--line)', border: '1px solid var(--line)' }}>
          {FEATURES.map((f, i) => (
            <div key={i} className={`reveal ${i > 0 ? 'reveal-delay-' + Math.min(i, 3) : ''}`} style={{
              background: 'var(--ink)', padding: '48px 40px', position: 'relative', overflow: 'hidden',
              transition: 'background 0.4s', cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#111113'; e.currentTarget.querySelector('.svc-line').style.transform = 'scaleX(1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.querySelector('.svc-line').style.transform = 'scaleX(0)'; }}
            >
              <div className="svc-line" style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: 'var(--gold)', transform: 'scaleX(0)', transformOrigin: 'left',
                transition: 'transform 0.4s cubic-bezier(0.25,1,0.5,1)',
              }} />
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '24px' }}>{f.num}</div>
              <div style={{ fontSize: '32px', marginBottom: '20px' }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '12px' }}>{f.title}</div>
              <p style={{ fontSize: '12.5px', fontWeight: 300, lineHeight: 1.85, color: 'var(--text-secondary)' }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── STATS BAND ─── */}
      <div className="reveal" style={{
        padding: '80px 60px', background: 'var(--ink-soft)',
        borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      }}>
        {STATS.map((s, i) => (
          <div key={i} className={`reveal reveal-delay-${i + 1}`} style={{ padding: '0 48px', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '64px', fontWeight: 300, color: 'var(--gold)', lineHeight: 1 }}>
              {s.num}<span style={{ fontSize: '28px', verticalAlign: 'super' }}>{s.sup}</span>
            </span>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginTop: '12px' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* ─── CTA ─── */}
      <section className="reveal" style={{
        padding: '140px 60px', background: 'var(--ink)', display: 'grid',
        gridTemplateColumns: '1.4fr 1fr', gap: '80px', alignItems: 'center', position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 80% at 80% 50%, rgba(201,168,76,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div>
          <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <span style={{ width: '28px', height: '1px', background: 'var(--gold)', display: 'block' }} />
            Start Today
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 300, lineHeight: 1.1 }}>
            A <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>voice</em> is all<br />you need.
          </h2>
          <p style={{ fontSize: '13.5px', fontWeight: 300, lineHeight: 1.9, color: 'var(--text-secondary)', margin: '28px 0 48px', maxWidth: '400px' }}>
            No signup required. Just speak your language and VAANI will guide you through FD rates, SIP options, tax savings, and government schemes — all for free.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={goToDashboard} className="btn-gold btn-lg">Enter Dashboard</button>
            <button onClick={() => navigate('/auth')} className="btn-outline btn-lg">Create Account</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>Quick Access</div>
          {['FD Rate Comparison', 'SIP Recommendations', 'Tax Calculator', 'Government Schemes'].map((item, i) => (
            <button key={i} onClick={goToDashboard} style={{
              width: '100%', textAlign: 'left', padding: '20px 24px',
              background: 'rgba(245,240,232,0.03)', border: '1px solid var(--line)',
              color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-sans)',
              fontWeight: 300, transition: 'all 0.3s', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = 'var(--ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,240,232,0.03)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              {item} <span>→</span>
            </button>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: '#060606', borderTop: '1px solid var(--line)', padding: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '8px' }}>
              VA<span style={{ color: 'var(--gold)' }}>A</span>NI
            </div>
            <p style={{ fontSize: '12px', fontWeight: 300, color: 'var(--text-tertiary)', maxWidth: '260px' }}>
              Voice-first financial advisor for every Indian. Free forever. Made for Bharat 🇮🇳
            </p>
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            {['Privacy', 'Terms', 'Contact', 'GitHub'].map(link => (
              <a key={link} href="#" style={{ color: 'var(--text-tertiary)', fontSize: '12px', textDecoration: 'none', transition: 'color 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >{link}</a>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(201,168,76,0.08)', marginTop: '40px', paddingTop: '24px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
          © 2026 VAANI. Not a bank or financial advisor. Information only. No investment advice.
        </div>
      </footer>
    </div>
  );
}