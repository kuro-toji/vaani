import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ASCII_LOGO = `
 ██╗   ██╗ █████╗ ██████╗  █████╗ ███╗   ██╗
 ██║   ██║██╔══██╗██╔══██╗██╔══██╗████╗  ██║
 ██║   ██║███████║██████╔╝███████║██╔██╗ ██║
 ╚██╗ ██╔╝██╔══██║██╔══██╗██╔══██║██║╚██╗██║
  ╚████╔╝ ██║  ██║██║  ██║██║  ██║██║ ╚████║
   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
`;

const LANGUAGES = [
  { code: 'hi', name: 'हिन्दी', native: 'Hindi' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'bn', name: 'বাংলা', native: 'Bengali' },
  { code: 'ta', name: 'தமிழ்', native: 'Tamil' },
  { code: 'te', name: 'తెలుగు', native: 'Telugu' },
  { code: 'mr', name: 'मराठी', native: 'Marathi' },
  { code: 'gu', name: 'ગુજરાતી', native: 'Gujarati' },
  { code: 'kn', name: 'ಕನ್ನಡ', native: 'Kannada' },
  { code: 'ml', name: 'മലയാളം', native: 'Malayalam' },
];

const CONTENT = {
  hi: {
    eyebrow: 'भारत की पहली आवाज-आधारित वित्तीय सहायक',
    title: 'अपनी भाषा में,\n<em>अपने वित्त</em> पर नियंत्रण',
    subtitle: 'किसी भी भाषी में बोलें — वाणी आपके पैसों का प्रबंधन करेगी। FD, SIP, क्रिप्टो, टैक्स — सब कुछ आपकी भाषा में।',
    cta: 'अभी शुरू करें',
    philosophy: 'हमारी फिलॉसफी',
    quote: 'सच्ची संपत्ति वह नहीं जो आप इकट्ठा करते हैं, बल्कि वह है जो <em>टिकती है</em>।',
    philosophyText: 'वाणी का उद्देश्य हर भारतीय परिवार को वित्तीय साक्षरता और स्वतंत्रता देना है। हम चुनौतियों को समझते हैं — भाषा की बाधाएं, जटिल वित्तीय नियम, और सीमित सेवाएं।',
    features: 'हमारी सेवाएं',
  },
  en: {
    eyebrow: 'India\'s First Voice-First Financial Advisor',
    title: 'Speak Your Language,\nTake Control of <em>Your Finances</em>',
    subtitle: 'Talk in any language — Vaani manages your money. FD, SIP, Crypto, Tax — everything in your language.',
    cta: 'Get Started',
    philosophy: 'Our Philosophy',
    quote: 'True wealth is not measured by what you accumulate, but by what <em>endures</em>.',
    philosophyText: 'Vaani\'s mission is to bring financial literacy and independence to every Indian household. We understand the challenges — language barriers, complex financial rules, and limited access to quality advice.',
    features: 'Our Services',
  },
};

export default function LandingPage({ onLogin }) {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('vaani_language') || 'en';
    setLang(savedLang);
  }, []);

  const t = CONTENT[lang] || CONTENT.en;

  const handleLanguageChange = (code) => {
    setLang(code);
    localStorage.setItem('vaani_language', code);
  };

  const handleGetStarted = () => {
    if (onLogin) onLogin();
    navigate('/dashboard');
  };

  return (
    <div className="landing-page" style={{ background: 'var(--ink)', minHeight: '100vh' }}>
      {/* Custom Cursor */}
      <div className="cursor" id="cursor"></div>
      <div className="cursor-ring" id="cursor-ring"></div>

      {/* NAV */}
      <nav>
        <div className="nav-logo">VAANI <span>✦</span> WEALTH</div>
        <ul className="nav-links">
          <li><a href="#philosophy">Philosophy</a></li>
          <li><a href="#services">Services</a></li>
          <li><a href="#features">Features</a></li>
        </ul>
        <button className="nav-cta" onClick={handleGetStarted}>
          Open Dashboard
        </button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>

        <div className="stat-float">
          <div className="stat-num">₹50L+ Cr</div>
          <div className="stat-label">Portfolio Tracked</div>
        </div>
        <div className="stat-float">
          <div className="stat-num">10L+</div>
          <div className="stat-label">Happy Users</div>
        </div>

        <div className="hero-eyebrow">{t.eyebrow}</div>
        
        {/* ASCII Logo */}
        <pre className="hero-ascii" dangerouslySetInnerHTML={{ __html: ASCII_LOGO }}></pre>

        <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: t.title }}></h1>
        <p className="hero-sub">{t.subtitle}</p>

        <div className="hero-actions">
          <button className="btn-primary" onClick={handleGetStarted}>
            {t.cta} →
          </button>
          <a href="#services" className="btn-ghost">Learn More</a>
        </div>

        {/* Language Selector */}
        <div className="lang-selector">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={`lang-btn ${lang === l.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(l.code)}
            >
              {l.name}
            </button>
          ))}
        </div>

        <div className="hero-scroll">
          <div className="scroll-text">Scroll</div>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-strip">
        <div className="marquee-track">
          <span>Voice-First Finance</span>
          <span>22+ Indian Languages</span>
          <span>FD Tracker</span>
          <span>SIP Planner</span>
          <span>Crypto Wallet</span>
          <span>Tax Engine</span>
          <span>Idle Money Optimizer</span>
          <span>Freelancer OS</span>
          <span>Voice-First Finance</span>
          <span>22+ Indian Languages</span>
          <span>FD Tracker</span>
          <span>SIP Planner</span>
          <span>Crypto Wallet</span>
          <span>Tax Engine</span>
          <span>Idle Money Optimizer</span>
          <span>Freelancer OS</span>
        </div>
      </div>

      {/* PHILOSOPHY */}
      <section className="section-philosophy" id="philosophy">
        <div className="phil-left">
          <div className="section-tag">{t.philosophy}</div>
          <blockquote className="phil-quote" dangerouslySetInnerHTML={{ __html: t.quote }}></blockquote>
          <p className="phil-body">{t.philosophyText}</p>
          <div className="phil-sig">
            <div>
              <div className="sig-name">वाणी AI</div>
              <div className="sig-title">Your Financial Companion</div>
            </div>
          </div>
        </div>
        <div className="phil-right">
          <div className="phil-pattern"></div>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.12 }} viewBox="0 0 600 700">
            <circle cx="300" cy="350" r="240" fill="none" stroke="#C9A84C" strokeWidth="1"/>
            <circle cx="300" cy="350" r="180" fill="none" stroke="#C9A84C" strokeWidth="0.5"/>
            <circle cx="300" cy="350" r="120" fill="none" stroke="#C9A84C" strokeWidth="0.5"/>
            <line x1="60" y1="350" x2="540" y2="350" stroke="#C9A84C" strokeWidth="0.5"/>
            <line x1="300" y1="110" x2="300" y2="590" stroke="#C9A84C" strokeWidth="0.5"/>
            <polygon points="300,140 490,450 110,450" fill="none" stroke="#C9A84C" strokeWidth="0.5"/>
          </svg>
          <div className="phil-num">Vaani</div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section-services" id="services">
        <div className="services-header reveal">
          <div>
            <div className="section-tag">What We Offer</div>
            <h2 className="section-title">Powerful <em>Features</em></h2>
          </div>
          <p className="services-desc">Everything you need to manage your wealth — in your language.</p>
        </div>

        <div className="services-grid">
          <ServiceCard num="01" name="FD Tracker" body="Track fixed deposits across 50+ banks. Get real-time rates and maturity alerts." icon={<FDIcon/>} />
          <ServiceCard num="02" name="SIP Planner" body="Plan systematic investments in 5000+ mutual funds. Track NAV in real-time." icon={<SIPIcon/>} />
          <ServiceCard num="03" name="Crypto Wallet" body="Monitor BTC, ETH, and 100+ cryptos with live INR prices from Binance." icon={<CryptoIcon/>} />
          <ServiceCard num="04" name="Tax Engine" body="Calculate taxes, find deductions under 80C, 80D, 80CCD. Optimize savings." icon={<TaxIcon/>} />
          <ServiceCard num="05" name="Idle Money" body="Find your idle funds and get smart suggestions to maximize returns." icon={<IdleIcon/>} />
          <ServiceCard num="06" name="Freelancer OS" body="Track income, expenses, invoices. Plan taxes as a freelancer." icon={<FreelanceIcon/>} />
          <ServiceCard num="07" name="Credit Intelligence" body="Check CIBIL score, get personalized loan recommendations." icon={<CreditIcon/>} />
          <ServiceCard num="08" name="Command Center" body="Net worth calculation, FIRE calculator, and debt tracking." icon={<CommandIcon/>} />
          <ServiceCard num="09" name="Voice Interface" body="Speak in Hindi, Tamil, Bengali — anything. Vaani understands." icon={<VoiceIcon/>} />
        </div>
      </section>

      {/* METRICS */}
      <div className="metrics-band">
        <div className="metric reveal">
          <span className="metric-num">50<span className="metric-sup">L+</span></span>
          <span className="metric-label">Portfolio Tracked</span>
        </div>
        <div className="metric reveal reveal-delay-1">
          <span className="metric-num">22<span className="metric-sup">+</span></span>
          <span className="metric-label">Languages</span>
        </div>
        <div className="metric reveal reveal-delay-2">
          <span className="metric-num">50<span className="metric-sup">+</span></span>
          <span className="metric-label">Banks Supported</span>
        </div>
        <div className="metric reveal reveal-delay-3">
          <span className="metric-num">5K<span className="metric-sup">+</span></span>
          <span className="metric-label">Mutual Funds</span>
        </div>
      </div>

      {/* CTA */}
      <section className="section-cta">
        <div className="cta-glow"></div>
        <div>
          <div className="section-tag reveal">Ready to Start?</div>
          <h2 className="cta-title reveal">Your Financial <em>Journey</em><br/>Starts Here</h2>
          <p className="cta-body reveal">Join thousands of Indians who trust Vaani to manage their wealth. Free to start, powerful forever.</p>
          <div className="reveal" style={{ display: 'flex', gap: 40 }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: 'var(--gold)' }}>🇮🇳 India</div>
              <div style={{ fontSize: 11, letterSpacing: '0.1em', color: 'rgba(245,240,232,0.3)', marginTop: 4 }}>Made for Bharat</div>
            </div>
          </div>
        </div>
        <div className="cta-actions reveal reveal-delay-2">
          <div style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Get Started Free</div>
          <div className="cta-form">
            <div className="form-row">
              <input className="form-field" type="tel" placeholder="Phone Number" />
            </div>
            <button className="form-submit" onClick={handleGetStarted}>Open Dashboard →</button>
            <div className="form-note">100% Free • No Credit Card Required</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div>
            <div className="footer-brand">VAANI <span>✦</span> WEALTH</div>
            <p className="footer-tagline">India's voice-first financial advisor. Managing wealth in every language since 2024.</p>
          </div>
          <div className="footer-col">
            <h4>Features</h4>
            <ul>
              <li><a href="#">FD Tracker</a></li>
              <li><a href="#">SIP Planner</a></li>
              <li><a href="#">Crypto Wallet</a></li>
              <li><a href="#">Tax Engine</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">API Reference</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Community</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-legal">© 2024 Vaani Wealth. All rights reserved. SEBI Registered.</div>
          <div className="footer-reg">Investments carry risk. Consult before making financial decisions.<br/>Not a substitute for professional advice.</div>
        </div>
      </footer>

      <style>{`
        .landing-page .cursor { position: fixed; z-index: 9999; width: 10px; height: 10px; border-radius: 50%; background: var(--gold); pointer-events: none; transform: translate(-50%,-50%); }
        .landing-page .cursor-ring { position: fixed; z-index: 9998; width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--gold); pointer-events: none; transform: translate(-50%,-50%); opacity: 0.5; }
      `}</style>
    </div>
  );
}

function ServiceCard({ num, name, body, icon }) {
  return (
    <div className="service-card reveal">
      <div className="svc-num">{num}</div>
      <div className="svc-icon">{icon}</div>
      <div className="svc-name">{name}</div>
      <p className="svc-body">{body}</p>
      <div className="svc-arrow">→</div>
    </div>
  );
}

// SVG Icons
function FDIcon() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="#C9A84C" strokeWidth="1"><rect x="5" y="8" width="30" height="24" rx="2"/><line x1="5" y1="16" x2="35" y2="16"/><circle cx="20" cy="22" r="4"/><line x1="20" y1="26" x2="20" y2="32"/></svg>;
}
function SIPIcon() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="#C9A84C" strokeWidth="1"><rect x="6" y="18" width="8" height="16"/><rect x="16" y="12" width="8" height="22"/><rect x="26" y="6" width="8" height="28"/><line x1="6" y1="26" x2="34" y2="26" strokeDasharray="2 2"/></svg>;
}
function CryptoIcon() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="#C9A84C" strokeWidth="1"><circle cx="20" cy="20" r="14"/><path d="M20 8 L24 16 L32 16 L26 22 L28 30 L20 25 L12 30 L14 22 L8 16 L16 16 Z"/></svg>;
}
function TaxIcon() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="#C9A84C" strokeWidth="1"><rect x="8" y="4" width="24" height="32" rx="2"/><line x1="14" y1="12" x2="26" y2="12"/><line x1="14" y1="18" x2="26" y2="18"/><line x1="14" y1="24" x2="22" y2="24"/><circle cx="20" cy="30" r="2" fill="#C9A84C"/></svg>;
}
function IdleIcon() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="#C9A84C" strokeWidth="1"><circle cx="20" cy="20" r="14"/><path d="M12 20 L16 20 L18 16 L22 24 L24 20 L28 20" strokeLinecap="round"/></svg>;
}
function FreelanceIcon() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="#C9A84C" strokeWidth="1"><rect x="6" y="6" width="28" height="28" rx="2"/><line x1="12" y1="14" x2="28" y2="14"/><line x1="12" y1="20" x2="28" y2="20"/><line x1="12" y1="26" x2="20" y2="26"/><path d="M28 26 L32 30 L28 34" strokeLinecap="round"/></svg>;
}
function CreditIcon() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="#C9A84C" strokeWidth="1"><rect x="4" y="10" width="32" height="20" rx="3"/><line x1="4" y1="18" x2="36" y2="18"/><rect x="8" y="22" width="8" height="4" rx="1"/></svg>;
}
function CommandIcon() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="#C9A84C" strokeWidth="1"><circle cx="20" cy="20" r="14"/><circle cx="20" cy="20" r="6"/><line x1="20" y1="6" x2="20" y2="10"/><line x1="20" y1="30" x2="20" y2="34"/><line x1="6" y1="20" x2="10" y2="20"/><line x1="30" y1="20" x2="34" y2="20"/></svg>;
}
function VoiceIcon() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="#C9A84C" strokeWidth="1"><rect x="14" y="4" width="12" height="20" rx="6"/><path d="M8 18 Q8 32 20 32 Q32 32 32 18"/><line x1="20" y1="32" x2="20" y2="36"/><line x1="14" y1="36" x2="26" y2="36"/></svg>;
}
