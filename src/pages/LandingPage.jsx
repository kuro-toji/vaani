import { useState, useEffect, useRef } from 'react';
import { getRegionByPincode } from '../services/pincodeService';
import { useLandingVoice } from '../hooks/useLandingVoice';
import { Mic } from 'lucide-react';
import { extractDigitsFromText } from '../data/indianDigitMap';

const languages = [
  { code: 'hi', name: 'हिन्दी', native: 'Hindi', flag: '🇮🇳', speakers: '600M+' },
  { code: 'ta', name: 'தமிழ்', native: 'Tamil', flag: '🇮🇳', speakers: '69M+' },
  { code: 'te', name: 'తెలుగు', native: 'Telugu', flag: '🇮🇳', speakers: '83M+' },
  { code: 'mr', name: 'मराठी', native: 'Marathi', flag: '🇮🇳', speakers: '83M+' },
  { code: 'bn', name: 'বাংলা', native: 'Bengali', flag: '🇮🇳', speakers: '268M+' },
  { code: 'gu', name: 'ગુજરાતી', native: 'Gujarati', flag: '🇮🇳', speakers: '60M+' },
  { code: 'kn', name: 'ಕನ್ನಡ', native: 'Kannada', flag: '🇮🇳', speakers: '50M+' },
  { code: 'ml', name: 'മലയാളം', native: 'Malayalam', flag: '🇮🇳', speakers: '38M+' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', native: 'Punjabi', flag: '🇮🇳', speakers: '33M+' },
  { code: 'or', name: 'ଓଡ଼ିଆ', native: 'Odia', flag: '🇮🇳', speakers: '35M+' },
  { code: 'as', name: 'অসমীয়া', native: 'Assamese', flag: '🇮🇳', speakers: '15M+' },
  { code: 'mai', name: 'मैथिली', native: 'Maithili', flag: '🇮🇳', speakers: '42M+' },
  { code: 'ur', name: 'اردو', native: 'Urdu', flag: '🇮🇳', speakers: '50M+' },
  { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ', native: 'Santali', flag: '🇮🇳', speakers: '7M+' },
  { code: 'ks', name: 'کٲشُر', native: 'Kashmiri', flag: '🇮🇳', speakers: '7M+' },
  { code: 'ne', name: 'नेपाली', native: 'Nepali', flag: '🇮🇳', speakers: '16M+' },
  { code: 'sd', name: 'سنڌي', native: 'Sindhi', flag: '🇮🇳', speakers: '2M+' },
  { code: 'kok', name: 'कोंकणी', native: 'Konkani', flag: '🇮🇳', speakers: '2M+' },
  { code: 'dgo', name: 'डोगरी', native: 'Dogri', flag: '🇮🇳', speakers: '2M+' },
  { code: 'brx', name: 'बड़ो', native: 'Bodo', flag: '🇮🇳', speakers: '1M+' },
  { code: 'mni', name: 'মেইতেই', native: 'Manipuri', flag: '🇮🇳', speakers: '1M+' },
  { code: 'sa', name: 'संस्कृतम्', native: 'Sanskrit', flag: '🇮🇳', speakers: '25K+' },
  { code: 'bho', name: 'भोजपुरी', native: 'Bhojpuri', flag: '🇮🇳', speakers: '50M+' },
  { code: 'raj', name: 'राजस्थानी', native: 'Rajasthani', flag: '🇮🇳', speakers: '20M+' },
  { code: 'hne', name: 'छत्तीसगढ़ी', native: 'Chhattisgarhi', flag: '🇮🇳', speakers: '16M+' },
  { code: 'tcy', name: 'ತುಳು', native: 'Tulu', flag: '🇮🇳', speakers: '1M+' },
  { code: 'bgc', name: 'हरियाणवी', native: 'Haryanvi', flag: '🇮🇳', speakers: '10M+' },
  { code: 'mag', name: 'मगही', native: 'Magahi', flag: '🇮🇳', speakers: '14M+' },
  { code: 'en', name: 'English', native: 'English', flag: '🌍', speakers: '1B+' },
];

const features = [
  {
    icon: '🎙️',
    title: 'Voice-First Design',
    description: 'Speak naturally in your language. No typing required.',
  },
  {
    icon: '🌐',
    title: '29+ Indian Languages',
    description: 'From Hindi to Assamese, connect in the language you know best.',
  },
  {
    icon: '🔒',
    title: 'Privacy First',
    description: 'Your conversations stay on your device. No data harvesting.',
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'Powered by local AI. Responses in seconds, not minutes.',
  },
  {
    icon: '♿',
    title: 'Accessibility Built-In',
    description: 'Large text, high contrast, haptic feedback. Designed for everyone.',
  },
  {
    icon: '🌐',
    title: 'Works Offline',
    description: 'Core features work without internet. Stay connected anywhere.',
  },
];

function LandingPage({ onStart }) {
  const [pincode, setPincode] = useState('');
  const [region, setRegion] = useState(null);
  const [detectedLang, setDetectedLang] = useState(null);
  const [isVisible, setIsVisible] = useState({});
  const mainContentRef = useRef(null);
  const pincodeInputRef = useRef(null);

  const { isListening: isListeningPincode, startListening: startPincodeVoice, stopListening: stopPincodeVoice } = useLandingVoice();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      document.body.style.animation = 'none';
      document.body.style.transition = 'none';
    }
    const handler = (e) => {
      if (e.matches) {
        document.body.style.animation = 'none';
        document.body.style.transition = 'none';
      }
    };
    prefersReducedMotion.addEventListener('change', handler);
    return () => prefersReducedMotion.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('section').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (pincode.length === 6) {
      const data = getRegionByPincode(pincode);
      setRegion(data);
      setDetectedLang(data.language);
    } else {
      setRegion(null);
      setDetectedLang(null);
    }
  }, [pincode]);

  const scrollToDemo = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('demo')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  const scrollToMain = () => {
    document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('main-content')?.focus();
  };

  const handleVoicePincode = () => {
    if (isListeningPincode) {
      stopPincodeVoice();
    } else {
      const selectedLang = detectedLang
        ? languages.find(l => l.native === detectedLang)?.code || 'en'
        : 'en';

      startPincodeVoice((text) => {
        const numbers = extractDigitsFromText(text).slice(0, 6);
        if (numbers.length > 0) {
          setPincode(numbers);
          if (numbers.length === 6) {
            stopPincodeVoice();
          }
        }
      }, selectedLang);
    }
  };

  const handleLanguageSelect = (lang) => {
    setDetectedLang(lang.name);
    const demoSection = document.getElementById('demo');
    if (demoSection) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      demoSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <div 
      className="min-h-screen bg-dark text-white font-sans overflow-x-hidden"
      style={{ 
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh'
      }}
    >
      <style>{`
        .gradient-text {
          background: linear-gradient(135deg, #00D4AA, #00A3FF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .gradient-bg {
          background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 212, 170, 0.3), transparent),
                      radial-gradient(ellipse 60% 40% at 70% 60%, rgba(0, 163, 255, 0.15), transparent);
          overflow: hidden;
        }
        .hero-gradient {
          background: linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, transparent 50%),
                      linear-gradient(225deg, rgba(0, 163, 255, 0.1) 0%, transparent 50%);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .card-hover {
          transition: all 0.3s ease;
        }
        .card-hover:hover {
          background-color: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }
        .mic-pulse {
          animation: micPulse 2s ease-in-out infinite;
        }
        @keyframes micPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .fade-in-up {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease;
        }
        .fade-in-up.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* Skip to Chat Link */}
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          scrollToMain();
        }}
      >
        Skip to Chat / चैट पर जाएं
      </a>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text">VAANI</span>
          </div>
          <button
            onClick={onStart}
            className="btn btn-ghost text-white border border-white/30 rounded-full px-5 py-2 text-sm font-medium transition hover:bg-white/10"
          >
            Try Now
          </button>
        </div>
      </nav>

      <main id="main-content" ref={mainContentRef} tabIndex={-1}>
        {/* Hero Section */}
        <section
          id="hero"
          className="min-h-screen flex flex-col items-center justify-center text-center p-6 md:p-12 relative gradient-bg"
          aria-labelledby="hero-heading"
        >
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm">
              <span>✨</span>
              <span>Voice AI for 1.4 Billion Indians</span>
            </div>

            <h1
              id="hero-heading"
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
            >
              <span className="block text-white/90">Speak. Understand.</span>
              <span className="block gradient-text mt-2">Connect.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/60 max-w-xl leading-relaxed">
              VAANI breaks language barriers with voice AI that speaks your language,
              understands your context, and respects your privacy.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mt-4">
              <button
                onClick={onStart}
                className="btn btn-primary rounded-full px-8 py-4 text-lg font-semibold shadow-glow flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <span>Start Talking</span>
                <span>→</span>
              </button>
              <button
                onClick={scrollToDemo}
                className="btn btn-secondary rounded-full px-8 py-4 text-lg font-medium border-white/30 text-white bg-transparent hover:bg-white/10"
              >
                See Demo
              </button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <span className="text-xs text-white/40">Scroll</span>
            <span className="text-xl text-white/40">↓</span>
          </div>
        </section>

        {/* Language Showcase */}
        <section
          id="languages"
          className="p-8 md:p-16 bg-dark"
          aria-labelledby="languages-heading"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 id="languages-heading" className="text-3xl md:text-4xl font-bold mb-4">
                Your Language. Your Voice.
              </h2>
              <p className="text-lg text-white/50 max-w-lg mx-auto">
                Enter your pincode to see how VAANI detects your region and language automatically.
              </p>
            </div>

            {/* Pincode Input */}
            <div className="max-w-md mx-auto mb-12 p-6 md:p-8 rounded-xl glass-card">
              <label
                id="pincode-label"
                className="block text-xs text-white/50 uppercase tracking-widest mb-3"
                htmlFor="pincode-input"
              >
                Enter Your Pincode (Optional)
              </label>
              <div className="flex gap-3">
                <input
                  id="pincode-input"
                  ref={pincodeInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="110001"
                  maxLength={6}
                  aria-label="अपना 6 अंकों का पिनकोड दर्ज करें"
                  aria-describedby="pincode-hint"
                  className="flex-1 p-4 text-2xl font-semibold bg-black/50 border-2 border-white/10 rounded-xl text-white text-center tracking-widest outline-none transition focus:border-[#00D4AA] focus:shadow-[0_0_0_4px_rgba(0,212,170,0.2)]"
                />
                <button
                  onClick={handleVoicePincode}
                  aria-label={isListeningPincode ? 'पिनकोड बोलना बंद करें' : 'पिनकोड बोलें'}
                  aria-pressed={isListeningPincode}
                  className="vaani-touch-target flex items-center justify-center min-w-14 bg-black/50 border-2 border-white/10 rounded-xl text-white transition hover:border-[#00D4AA] focus:ring-2 focus:ring-[#00D4AA] focus:ring-offset-2 focus:ring-offset-black"
                  style={{
                    backgroundColor: isListeningPincode ? '#00D4AA' : 'rgba(0,0,0,0.5)',
                    color: isListeningPincode ? '#000' : '#fff',
                    borderColor: isListeningPincode ? '#00D4AA' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Mic size={20} />
                </button>
              </div>
              <p id="pincode-hint" className="text-xs text-white/40 mt-3 text-center">
                पिनकोड दर्ज करें या खाली छोड़ दें • तो भी आप भाषा बदल सकते हैं
              </p>

              {!pincode && (
                <p role="status" className="text-sm text-[#00D4AA] mt-4 text-center font-medium" aria-live="polite">
                  तो भी आप भाषा बदल सकते हैं (You can still change language later)
                </p>
              )}

              {region && (
                <div className="mt-6 p-5 bg-[#00D4AA]/10 rounded-xl border border-[#00D4AA]/30 animate-fadeIn" role="status" aria-live="polite" aria-atomic="true">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">📍</span>
                    <div>
                      <div className="text-xl font-semibold">{region.region}</div>
                      <div className="text-sm text-white/60">{region.state}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🗣️</span>
                    <div>
                      <div className="text-xl font-semibold">{region.language}</div>
                      <div className="text-sm text-white/60">Detected as your primary language</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Language Grid */}
            <div
              role="listbox"
              aria-label="भाषा चुनें - Select your language"
              aria-describedby="languages-description"
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4"
            >
              {languages.map((lang, index) => (
                <div
                  key={lang.code}
                  data-lang-index={index}
                  role="option"
                  aria-selected={detectedLang === lang.name}
                  aria-label={`${lang.name}, ${lang.native}, ${lang.speakers} speakers`}
                  tabIndex={0}
                  onClick={() => handleLanguageSelect(lang)}
                  className={`fade-in-up p-4 md:p-6 rounded-2xl text-center cursor-pointer border transition-all duration-300 ${
                    detectedLang === lang.name
                      ? 'bg-white/10 border-[#00D4AA] border-2'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  style={{ transitionDelay: `${index * 30}ms` }}
                >
                  <div className="text-3xl md:text-4xl mb-2">{lang.flag}</div>
                  <div className="text-sm md:text-base font-semibold text-white mb-1">{lang.name}</div>
                  <div className="text-xs text-white/40 mb-2">{lang.native}</div>
                  <div className="text-xs text-[#00D4AA] font-medium">{lang.speakers}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="p-8 md:p-16 bg-black" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 id="features-heading" className="text-3xl md:text-4xl font-bold mb-4">
                Built Different
              </h2>
              <p className="text-lg text-white/50 max-w-lg mx-auto">
                Not just another chatbot. VAANI is designed from the ground up for India.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="VAANI features">
              {features.map((feature, index) => (
                <div
                  key={index}
                  role="listitem"
                  className="card-hover p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="text-5xl mb-5">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section
          id="demo"
          className="p-8 md:p-16 bg-dark"
          aria-labelledby="demo-heading"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 id="demo-heading" className="text-3xl md:text-4xl font-bold mb-4">
                Try It Now
              </h2>
              <p className="text-lg text-white/50 max-w-lg mx-auto">
                Click below to launch VAANI and start speaking in your language.
              </p>
            </div>

            {/* Demo Preview */}
            <div
              className="relative rounded-2xl border border-white/10 overflow-hidden bg-black/50 aspect-video flex flex-col items-center justify-center"
              role="region"
              aria-label="VAANI demo preview"
            >
              <div className="absolute inset-0 bg-gradient-radial from-[#00D4AA]/10 to-transparent pointer-events-none" aria-hidden="true" />
              <div className="relative z-10 text-center">
                <div className="text-7xl md:text-8xl mb-6 mic-pulse">🎙️</div>
                <p className="text-lg text-white/60 mb-6">VAANI is ready to listen</p>
                <button
                  onClick={onStart}
                  className="btn btn-primary rounded-full px-10 py-4 text-lg font-semibold flex items-center gap-2 mx-auto hover:scale-105 transition-transform"
                >
                  Start Speaking
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          id="cta"
          className="p-8 md:p-16 bg-black text-center"
          aria-labelledby="cta-heading"
        >
          <div className="max-w-2xl mx-auto">
            <h2 id="cta-heading" className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Ready to break the
              <br />
              <span className="gradient-text">language barrier?</span>
            </h2>
            <p className="text-lg text-white/50 mb-10 leading-relaxed">
              Join thousands of Indians who are already connecting through voice AI.
              No account required. No data shared.
            </p>
            <button
              onClick={onStart}
              className="btn btn-primary rounded-full px-12 py-5 text-xl font-bold flex items-center gap-3 mx-auto shadow-glow hover:scale-105 transition-transform"
            >
              <span>Launch VAANI</span>
              <span>→</span>
            </button>
          </div>
        </section>

        {/* Stats Section */}
        <section className="p-8 md:p-12 bg-black/50">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
              {[
                { label: 'Families Secured', value: '4.2M+' },
                { label: 'States Reached', value: '28' },
                { label: 'Total Saved', value: '₹1.5k Cr' },
                { label: 'Dialects Supported', value: '29' }
              ].map((stat, i) => (
                <div key={i} className="glass-card p-6 md:p-8 rounded-2xl">
                  <div className="text-3xl md:text-4xl font-bold text-[#00D4AA] mb-2">{stat.value}</div>
                  <div className="text-sm md:text-base text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How VAANI Works */}
        <section className="p-8 md:p-16 bg-dark">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">How VAANI Works</h2>
            <p className="text-lg text-white/60 mb-12">Three simple steps to secure your financial future.</p>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              {[
                { step: '1', title: 'Start Speaking', desc: 'Tap the mic in your native language. No typing required.' },
                { step: '2', title: 'We Analyze', desc: 'VAANI matches your needs with 100+ local financial data points.' },
                { step: '3', title: 'Take Action', desc: 'Get a clear, 3-step action plan that actually makes sense.' }
              ].map((item, i) => (
                <div key={i} className="relative p-8 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                  <div className="absolute -top-4 -right-4 text-8xl font-black text-white/5">{item.step}</div>
                  <h3 className="text-xl font-bold text-white mb-3 relative z-10">{item.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed relative z-10">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Accessibility Showcase */}
        <section className="p-8 md:p-16 bg-dark pb-32">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">The Curb-Cut Effect</h2>
            <p className="text-lg text-white/60 mb-12 max-w-xl mx-auto">
              Built for the 10% with disabilities. Frictionless for the 90% in rural areas.
            </p>

            <div className="grid md:grid-cols-2 gap-6 text-left">
              {[
                { icon: '👁️', bg: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', title: 'Visually Impaired', desc: 'Real-time STT/TTS engine with eyes-free haptic feedback loops and precise high-contrast UI modes.' },
                { icon: '🦽', bg: 'rgba(16, 185, 129, 0.2)', color: '#34D399', title: 'Motor Impaired', desc: 'Full-screen PTT mode turns the entire device surface into a single, highly forgiving interaction target.' },
                { icon: '🗣️', bg: 'rgba(168, 85, 247, 0.2)', color: '#C084FC', title: 'Speech Impaired', desc: 'Zero-vocal icon-card tap navigation allowing complete financial queries purely through iconography.' },
                { icon: '🧠', bg: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', title: 'Cognitively Reduced', desc: 'Traffic-light dashboard distilling complex portfolio health into singular Green/Yellow/Red indicators.' }
              ].map((card, i) => (
                <div key={i} className="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 items-start">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: card.bg }}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: card.color }}>{card.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-white/10 text-center" role="contentinfo" aria-label="Site footer">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-xl">🔊</span>
          <span className="text-lg font-bold gradient-text">VAANI</span>
        </div>
        <p className="text-sm text-white/40">
          Voice AI for India • Privacy-first • Made with ❤️
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;
