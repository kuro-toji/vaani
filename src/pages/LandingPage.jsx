import { useState, useEffect, useRef, useCallback } from 'react';
import { getRegionByPincode } from '../services/pincodeService';
import { useLandingVoice } from '../hooks/useLandingVoice';
import { Mic } from 'lucide-react';

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

// useLandingVoice is now imported from hooks/useLandingVoice.js

function LandingPage({ onStart }) {
  const [pincode, setPincode] = useState('');
  const [region, setRegion] = useState(null);
  const [detectedLang, setDetectedLang] = useState(null);
  const [isVisible, setIsVisible] = useState({});
  const [selectedLangIndex, setSelectedLangIndex] = useState(0);
  const heroRef = useRef(null);
  const mainContentRef = useRef(null);
  const pincodeInputRef = useRef(null);
  
  // Voice input for pincode
  const { isListening: isListeningPincode, startListening: startPincodeVoice, stopListening: stopPincodeVoice } = useLandingVoice();

  // Disable animations for users with prefers-reduced-motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const disableAnimations = () => {
      document.body.style.animation = 'none';
      document.body.style.transition = 'none';
    };
    
    if (prefersReducedMotion.matches) {
      disableAnimations();
    }
    
    const handler = (e) => {
      if (e.matches) {
        disableAnimations();
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
            // Focus management: move focus to section heading when visible
            const heading = entry.target.querySelector('h2');
            if (heading && !document.activeElement?.closest(`#${entry.target.id}`)) {
              // Only auto-focus if user isn't currently interacting
            }
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
    document.getElementById('demo')?.scrollIntoView({ 
      behavior: prefersReducedMotion ? 'auto' : 'smooth' 
    });
  };

  const scrollToMain = () => {
    document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('main-content')?.focus();
  };

  const handleVoicePincode = () => {
    if (isListeningPincode) {
      stopPincodeVoice();
    } else {
      startPincodeVoice((text) => {
        // Map spoken English words, Hindi words, and native Devanagari digits → ASCII digits
        const wordToDigit = {
          // English words
          'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
          'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
          'to': '2', 'for': '4', 'too': '2', 'won': '1', 'ate': '8',
          // Hindi words
          'शून्य': '0', 'एक': '1', 'दो': '2', 'तीन': '3', 'ती': '3',
          'चार': '4', 'पांच': '5', 'पाँच': '5', 'छह': '6', 'छः': '6',
          'सात': '7', 'आठ': '8', 'नौ': '9',
          // Devanagari digits
          '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
          '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
        };
        
        let processedText = text.toLowerCase().trim();
        
        // Sort keys by length descending so longer words match first ("three" before "ती")
        const sortedKeys = Object.keys(wordToDigit).sort((a, b) => b.length - a.length);
        sortedKeys.forEach(word => {
          processedText = processedText.replace(new RegExp(word, 'gi'), wordToDigit[word]);
        });

        // Extract only digit characters
        const cleaned = processedText.replace(/\D/g, '');
        const numbers = cleaned.slice(0, 6);
        
        if (numbers.length > 0) {
          setPincode(numbers);
          // If 6 valid digits recognized, auto-stop the mic
          if (numbers.length === 6) {
            stopPincodeVoice();
          }
        }
      });
    }
  };

  const handleLanguageSelect = (lang) => {
    setDetectedLang(lang.name);
    // Scroll to demo or trigger start
    const demoSection = document.getElementById('demo');
    if (demoSection) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      demoSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  // Keyboard navigation for language grid
  const handleLanguageKeyDown = (e, index) => {
    const gridCols = 3; // approximate for responsive
    let newIndex = index;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = Math.min(index + 1, languages.length - 1);
        break;
      case 'ArrowLeft':
        newIndex = Math.max(index - 1, 0);
        break;
      case 'ArrowDown':
        newIndex = Math.min(index + 4, languages.length - 1);
        break;
      case 'ArrowUp':
        newIndex = Math.max(index - 4, 0);
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = languages.length - 1;
        break;
      case 'Enter':
      case ' ':
        // Select language (could trigger something)
        e.preventDefault();
        return;
      default:
        return;
    }

    e.preventDefault();
    setSelectedLangIndex(newIndex);
    
    // Focus the new language element
    const langElements = document.querySelectorAll('[data-lang-index]');
    langElements[newIndex]?.focus();
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#000',
        color: '#fff',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* Skip to Chat Link - FIRST child for accessibility */}
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
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="Vaani Logo" style={{ height: '32px', width: 'auto' }} />
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #00D4AA, #00A3FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            VAANI
          </span>
        </div>
        <button
          onClick={onStart}
          aria-label="Try VAANI now - start chatting"
          style={{
            backgroundColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: '980px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
          onFocus={(e) => {
            e.target.style.outline = '2px solid #00D4AA';
            e.target.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.target.style.outline = 'none';
          }}
        >
          Try Now
        </button>
      </nav>

      {/* Main Content - This is where skip link jumps to */}
      <main id="main-content" ref={mainContentRef} tabIndex={-1}>
        {/* Hero Section */}
        <section
          id="hero"
          ref={heroRef}
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '120px 24px 80px',
            position: 'relative',
          }}
          aria-labelledby="hero-heading"
        >
          {/* Background gradient */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 212, 170, 0.3), transparent), radial-gradient(ellipse 60% 40% at 70% 60%, rgba(0, 163, 255, 0.15), transparent)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img 
              src="/logo.png" 
              alt="Vaani" 
              style={{ 
                height: '140px', 
                width: 'auto', 
                marginBottom: '24px', 
                filter: 'drop-shadow(0 0 20px rgba(0, 212, 170, 0.4))' 
              }} 
            />
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '8px 16px',
                borderRadius: '980px',
                fontSize: '14px',
                marginBottom: '32px',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
              role="status"
              aria-label="Feature announcement"
            >
              <span style={{ fontSize: '16px' }} aria-hidden="true">✨</span>
              <span>Voice AI for 1.4 Billion Indians</span>
            </div>

            <h1
              id="hero-heading"
              style={{
                fontSize: 'clamp(40px, 10vw, 80px)',
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: '24px',
                letterSpacing: '-0.02em',
              }}
            >
              <span
                style={{
                  background: 'linear-gradient(135deg, #fff 0%, #999 50%, #fff 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              >
                Speak. Understand.
              </span>
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #00D4AA, #00A3FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Connect.
              </span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(16px, 3vw, 20px)',
                color: 'rgba(255,255,255,0.6)',
                maxWidth: '600px',
                marginBottom: '48px',
                lineHeight: 1.6,
              }}
            >
              VAANI breaks language barriers with voice AI that speaks your language,
              understands your context, and respects your privacy.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={onStart}
                aria-label="Start Talking - Enter main chat"
                style={{
                  backgroundColor: '#00D4AA',
                  color: '#000',
                  border: 'none',
                  padding: '16px 40px',
                  borderRadius: '980px',
                  fontSize: '18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 8px 32px rgba(0, 212, 170, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
                onFocus={(e) => {
                  e.target.style.outline = '2px solid #00D4AA';
                  e.target.style.outlineOffset = '4px';
                }}
                onBlur={(e) => {
                  e.target.style.outline = 'none';
                }}
              >
                <span>Start Talking</span>
                <span style={{ fontSize: '20px' }} aria-hidden="true">→</span>
              </button>
              <button
                onClick={scrollToDemo}
                aria-label="See demo - scroll to demo section"
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '16px 40px',
                  borderRadius: '980px',
                  fontSize: '18px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
                onFocus={(e) => {
                  e.target.style.outline = '2px solid #00D4AA';
                  e.target.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.target.style.outline = 'none';
                }}
              >
                See Demo
              </button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              animation: 'bounce 2s ease-in-out infinite',
            }}
            role="presentation"
            aria-hidden="true"
          >
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Scroll</span>
            <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)' }}>↓</span>
          </div>
        </section>
      </main>

      {/* Language Showcase */}
      <section
        id="languages"
        style={{
          padding: '100px 24px',
          backgroundColor: '#0a0a0a',
        }}
        aria-labelledby="languages-heading"
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2
              id="languages-heading"
              style={{
                fontSize: 'clamp(28px, 5vw, 48px)',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              Your Language. Your Voice.
            </h2>
            <p
              style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.5)',
                maxWidth: '500px',
                margin: '0 auto',
              }}
              id="languages-description"
            >
              Enter your pincode to see how VAANI detects your region and language automatically. Or just click "Start VAANI" to begin with Hindi as default.
            </p>
          </div>

          {/* Pincode Input */}
          <div
            style={{
              maxWidth: '500px',
              margin: '0 auto 64px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '24px',
              padding: '32px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            role="region"
            aria-labelledby="pincode-label"
          >
            <label
              id="pincode-label"
              style={{
                display: 'block',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
              htmlFor="pincode-input"
            >
              Enter Your Pincode (Optional)
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
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
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  fontSize: '24px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  color: '#fff',
                  textAlign: 'center',
                  letterSpacing: '0.2em',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#00D4AA';
                  e.target.style.boxShadow = '0 0 0 4px rgba(0, 212, 170, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={handleVoicePincode}
                aria-label={isListeningPincode ? 'पिनकोड बोलना बंद करें' : 'पिनकोड बोलें'}
                aria-pressed={isListeningPincode}
                className="vaani-touch-target"
                style={{
                  minWidth: '56px',
                  minHeight: '56px',
                  backgroundColor: isListeningPincode ? '#00D4AA' : 'rgba(0,0,0,0.5)',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  color: isListeningPincode ? '#000' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.outline = '2px solid #00D4AA';
                  e.target.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.target.style.outline = 'none';
                }}
              >
                <Mic size={20} aria-hidden="true" />
              </button>
            </div>
            <p id="pincode-hint" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '12px', textAlign: 'center' }}>
              पिनकोड दर्ज करें या खाली छोड़ दें • तो भी आप भाषा बदल सकते हैं
            </p>
            
            {/* Optional notice when pincode is empty */}
            {!pincode && (
              <p 
                role="status" 
                style={{ 
                  fontSize: '14px', 
                  color: '#00D4AA', 
                  marginTop: '16px', 
                  textAlign: 'center',
                  fontWeight: 500,
                }}
                aria-live="polite"
              >
                तो भी आप भाषा बदल सकते हैं (You can still change language later)
              </p>
            )}
            
            {region && (
              <div
                style={{
                  marginTop: '24px',
                  padding: '20px',
                  backgroundColor: 'rgba(0, 212, 170, 0.1)',
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 212, 170, 0.3)',
                  animation: 'fadeIn 0.3s ease',
                }}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '32px' }} aria-hidden="true">📍</span>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>{region.region}</div>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{region.state}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '32px' }} aria-hidden="true">🗣️</span>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>{region.language}</div>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                      Detected as your primary language
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Language Grid with proper ARIA */}
          <h3 
            id="language-grid-label" 
            className="sr-only"
          >
            भाषा चुनें - Select Language
          </h3>
          <div
            role="listbox"
            aria-label="भाषा चुनें - Select your language"
            aria-describedby="languages-description"
            aria-orientation="horizontal"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px',
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              // Grid-level keyboard navigation
              const focused = document.activeElement;
              const items = Array.from(document.querySelectorAll('[data-lang-index]'));
              const currentIndex = items.indexOf(focused);
              
              if (currentIndex === -1) return;
              
              let newIndex = currentIndex;
              switch (e.key) {
                case 'ArrowRight':
                  newIndex = Math.min(currentIndex + 1, languages.length - 1);
                  break;
                case 'ArrowLeft':
                  newIndex = Math.max(currentIndex - 1, 0);
                  break;
                case 'ArrowDown':
                  newIndex = Math.min(currentIndex + 4, languages.length - 1);
                  break;
                case 'ArrowUp':
                  newIndex = Math.max(currentIndex - 4, 0);
                  break;
                case 'Home':
                  newIndex = 0;
                  break;
                case 'End':
                  newIndex = languages.length - 1;
                  break;
                default:
                  return;
              }
              
              e.preventDefault();
              items[newIndex]?.focus();
            }}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLanguageSelect(lang);
                  } else {
                    handleLanguageKeyDown(e, index);
                  }
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '20px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderWidth: detectedLang === lang.name ? '2px' : '1px',
                  borderColor: detectedLang === lang.name ? '#00D4AA' : 'rgba(255,255,255,0.08)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  opacity: isVisible['languages'] ? 1 : 0,
                  transform: isVisible['languages'] ? 'translateY(0)' : 'translateY(20px)',
                  transitionDelay: `${index * 50}ms`,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00D4AA';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '12px' }} aria-hidden="true">{lang.flag}</div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#fff',
                    marginBottom: '4px',
                  }}
                >
                  {lang.name}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.4)',
                    marginBottom: '8px',
                  }}
                  aria-hidden="true"
                >
                  {lang.native}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#00D4AA',
                    fontWeight: 500,
                  }}
                  aria-hidden="true"
                >
                  {lang.speakers}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        style={{
          padding: '100px 24px',
          backgroundColor: '#000',
        }}
        aria-labelledby="features-heading"
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2
              id="features-heading"
              style={{
                fontSize: 'clamp(28px, 5vw, 48px)',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              Built Different
            </h2>
            <p
              style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.5)',
                maxWidth: '500px',
                margin: '0 auto',
              }}
            >
              Not just another chatbot. VAANI is designed from the ground up for India.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}
            role="list"
            aria-label="VAANI features"
          >
            {features.map((feature, index) => (
              <div
                key={index}
                role="listitem"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '24px',
                  padding: '32px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.3s ease',
                  opacity: isVisible['features'] ? 1 : 0,
                  transform: isVisible['features'] ? 'translateY(0)' : 'translateY(20px)',
                  transitionDelay: `${index * 100}ms`,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    fontSize: '48px',
                    marginBottom: '20px',
                  }}
                  aria-hidden="true"
                >
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#fff',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: '15px',
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.6,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section
        id="demo"
        style={{
          padding: '100px 24px',
          backgroundColor: '#0a0a0a',
        }}
        aria-labelledby="demo-heading"
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2
              id="demo-heading"
              style={{
                fontSize: 'clamp(28px, 5vw, 48px)',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              Try It Now
            </h2>
            <p
              style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.5)',
                maxWidth: '500px',
                margin: '0 auto',
              }}
            >
              Click below to launch VAANI and start speaking in your language.
            </p>
          </div>

          {/* Demo Preview */}
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
              aspectRatio: '16/9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            role="region"
            aria-label="VAANI demo preview"
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at center, rgba(0, 212, 170, 0.1), transparent 70%)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  fontSize: '80px',
                  marginBottom: '24px',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
                aria-hidden="true"
              >
                🎙️
              </div>
              <p
                style={{
                  fontSize: '18px',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '24px',
                }}
              >
                VAANI is ready to listen
              </p>
              <button
                onClick={onStart}
                aria-label="Start Speaking - Launch VAANI chat"
                style={{
                  backgroundColor: '#00D4AA',
                  color: '#000',
                  border: 'none',
                  padding: '16px 48px',
                  borderRadius: '980px',
                  fontSize: '18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
                onFocus={(e) => {
                  e.target.style.outline = '2px solid #00D4AA';
                  e.target.style.outlineOffset = '4px';
                }}
                onBlur={(e) => {
                  e.target.style.outline = 'none';
                }}
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
        style={{
          padding: '100px 24px',
          backgroundColor: '#000',
          textAlign: 'center',
        }}
        aria-labelledby="cta-heading"
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2
            id="cta-heading"
            style={{
              fontSize: 'clamp(32px, 6vw, 56px)',
              fontWeight: 700,
              marginBottom: '24px',
              lineHeight: 1.2,
            }}
          >
            Ready to break the
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #00D4AA, #00A3FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              language barrier?
            </span>
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '40px',
              lineHeight: 1.6,
            }}
          >
            Join thousands of Indians who are already connecting through voice AI.
            No account required. No data shared.
          </p>
          <button
            onClick={onStart}
            aria-label="Launch VAANI - Start chatting in your language"
            style={{
              backgroundColor: '#00D4AA',
              color: '#000',
              border: 'none',
              padding: '20px 60px',
              borderRadius: '980px',
              fontSize: '20px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 12px 40px rgba(0, 212, 170, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'none';
            }}
            onFocus={(e) => {
              e.target.style.outline = '2px solid #00D4AA';
              e.target.style.outlineOffset = '4px';
            }}
            onBlur={(e) => {
              e.target.style.outline = 'none';
            }}
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '80px 24px', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '24px',
            textAlign: 'center' 
          }}>
            {[
              { label: 'Families Secured', value: '4.2M+' },
              { label: 'States Reached', value: '28' },
              { label: 'Total Saved', value: '₹1.5k Cr' },
              { label: 'Dialects Supported', value: '29' }
            ].map((stat, i) => (
              <div key={i} className="glass-card" style={{ 
                padding: '32px 24px', 
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)'
              }}>
                <div style={{ fontSize: '40px', fontWeight: 800, color: '#00D4AA', marginBottom: '8px' }}>{stat.value}</div>
                <div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How VAANI Works */}
      <section style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 800, color: 'white', marginBottom: '16px' }}>How VAANI Works</h2>
          <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '64px' }}>Three simple steps to secure your financial future.</p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '24px',
            textAlign: 'left'
          }}>
            {[
              { step: '1', title: 'Start Speaking', desc: 'Tap the mic in your native language. No typing required.' },
              { step: '2', title: 'We Analyze', desc: 'VAANI matches your needs with 100+ local financial data points.' },
              { step: '3', title: 'Take Action', desc: 'Get a clear, 3-step action plan that actually makes sense.' }
            ].map((item, i) => (
              <div key={i} className="glass-card" style={{ 
                padding: '40px 32px', 
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-20px', 
                  right: '-10px', 
                  fontSize: '120px', 
                  fontWeight: 900, 
                  color: 'rgba(255, 255, 255, 0.03)' 
                }}>{item.step}</div>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '12px', position: 'relative' }}>{item.title}</h3>
                <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.6, position: 'relative' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accessibility Showcase */}
      <section style={{ padding: '80px 24px 140px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 800, color: 'white', marginBottom: '16px' }}>The Curb-Cut Effect</h2>
          <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '64px', maxWidth: '600px', margin: '0 auto 64px' }}>
            Built for the 10% with disabilities. Frictionless for the 90% in rural areas.
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '24px',
            textAlign: 'left'
          }}>
            {[
              { icon: '👁️', bg: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', title: 'Visually Impaired', desc: 'Real-time STT/TTS engine with eyes-free haptic feedback loops and precise high-contrast UI modes.' },
              { icon: '🦽', bg: 'rgba(16, 185, 129, 0.2)', color: '#34D399', title: 'Motor Impaired', desc: 'Full-screen PTT mode turns the entire device surface into a single, highly forgiving interaction target.' },
              { icon: '🗣️', bg: 'rgba(168, 85, 247, 0.2)', color: '#C084FC', title: 'Speech Impaired', desc: 'Zero-vocal icon-card tap navigation allowing complete financial queries purely through iconography.' },
              { icon: '🧠', bg: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', title: 'Cognitively Reduced', desc: 'Traffic-light dashboard distilling complex portfolio health into singular Green/Yellow/Red indicators.' }
            ].map((card, i) => (
              <div key={i} className="glass-card" style={{ 
                padding: '32px', 
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start'
              }}>
                <div style={{ 
                  width: '56px', height: '56px', borderRadius: '50%', 
                  background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '24px', flexShrink: 0 
                }}>{card.icon}</div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: card.color, marginBottom: '8px' }}>{card.title}</h3>
                  <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.6 }}>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '40px 24px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
        }}
        role="contentinfo"
        aria-label="Site footer"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <span style={{ fontSize: '20px' }} aria-hidden="true">🔊</span>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #00D4AA, #00A3FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            VAANI
          </span>
        </div>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
          Voice AI for India • Privacy-first • Made with ❤️
        </p>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        /* Screen reader only class */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
