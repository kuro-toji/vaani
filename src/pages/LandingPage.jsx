import { useState, useEffect, useRef } from 'react';
import { getRegionByPincode } from '../services/pincodeService';
import { useLandingVoice } from '../hooks/useLandingVoice';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';
import { Mic, MicOff } from 'lucide-react';

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
];

const features = [
  {
    icon: '🎙️',
    title: 'Voice-First Design',
    description: 'Speak naturally in your language. No typing required.',
  },
  {
    icon: '🌐',
    title: '12+ Indian Languages',
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
  const heroRef = useRef(null);
  const { isListening: isListeningPincode, startListening: startPincodeVoice, stopListening: stopPincodeVoice } = useLandingVoice();
  const { isListening: isVoiceNavListening, startListening: startVoiceNav, stopListening: stopVoiceNav } = useVoiceNavigation();

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

  // Disable smooth scroll if user prefers reduced motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const disableSmoothScroll = () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
    
    if (prefersReducedMotion.matches) {
      disableSmoothScroll();
    }
    
    prefersReducedMotion.addEventListener('change', (e) => {
      if (e.matches) {
        disableSmoothScroll();
      } else {
        document.documentElement.style.scrollBehavior = 'smooth';
      }
    });
  }, []);

  const handleLanguageKeyDown = (e, index) => {
    const gridCols = 3;
    let newIndex = index;
    
    switch (e.key) {
      case 'ArrowRight':
        newIndex = Math.min(index + 1, languages.length - 1);
        break;
      case 'ArrowLeft':
        newIndex = Math.max(index - 1, 0);
        break;
      case 'ArrowDown':
        newIndex = Math.min(index + gridCols, languages.length - 1);
        break;
      case 'ArrowUp':
        newIndex = Math.max(index - gridCols, 0);
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = languages.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleLanguageSelect(languages[index]);
        return;
      default:
        return;
    }
    
    e.preventDefault();
    const buttons = document.querySelectorAll('.language-card-btn');
    if (buttons[newIndex]) {
      buttons[newIndex].focus();
    }
  };

  const handleLanguageSelect = (lang) => {
    // Language selection logic - for now just log
    console.log('Selected language:', lang.code);
    if (onStart) onStart();
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
      {/* Skip Link - Accessibility */}
      <a href="#main-content" className="skip-link">
        🎤 Chat पर जाएं / Skip to Chat
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
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🔊</span>
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
        >
          Try Now
        </button>
      </nav>

      {/* Hero Section */}
      <section
        id="main-content"
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
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
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
          >
            <span style={{ fontSize: '16px' }}>✨</span>
            <span>Voice AI for 1.4 Billion Indians</span>
          </div>

          <h1
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
            >
              <span>Start Talking</span>
              <span style={{ fontSize: '20px' }}>→</span>
            </button>
            <button
              onClick={scrollToDemo}
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
        >
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Scroll</span>
          <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)' }}>↓</span>
        </div>
      </section>

      {/* Language Showcase */}
      <section
        id="languages"
        style={{
          padding: '100px 24px',
          backgroundColor: '#0a0a0a',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2
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
            >
              Enter your pincode to see how VAANI detects your region and language automatically.
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
          >
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Enter Your Pincode
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="110001"
                maxLength={6}
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
                onClick={() => {
                  if (isListeningPincode) {
                    stopPincodeVoice();
                  } else {
                    startPincodeVoice((text) => {
                      const numbers = text.replace(/\D/g, '').slice(0, 6);
                      if (numbers.length >= 4) {
                        setPincode(numbers);
                      }
                    });
                  }
                }}
                aria-label={isListeningPincode ? 'रिकॉर्डिंग बंद करें' : 'पिनकोड बोलें'}
                aria-pressed={isListeningPincode}
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
                }}
              >
                {isListeningPincode ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            </div>
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
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '32px' }}>📍</span>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>{region.region}</div>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{region.state}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '32px' }}>🗣️</span>
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

          {/* Language Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px',
            }}
          >
            {languages.map((lang, index) => (
              <div
                key={lang.code}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '20px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.3s ease',
                  cursor: 'default',
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
              >
                <button
                  onClick={() => handleLanguageSelect(lang)}
                  onKeyDown={(e) => handleLanguageKeyDown(e, index)}
                  tabIndex={0}
                  className="language-card-btn"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  aria-label={`${lang.name} (${lang.native}) - ${lang.speakers} speakers`}
                >
                  <span style={{ fontSize: '36px' }}>{lang.flag}</span>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#fff',
                      marginBottom: '0',
                    }}
                  >
                    {lang.name}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.4)',
                      marginBottom: '0',
                    }}
                  >
                    {lang.native}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#00D4AA',
                      fontWeight: 500,
                    }}
                  >
                    {lang.speakers}
                  </span>
                </button>
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
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2
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
          >
            {features.map((feature, index) => (
              <div
                key={index}
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
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2
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
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at center, rgba(0, 212, 170, 0.1), transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  fontSize: '80px',
                  marginBottom: '24px',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
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
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2
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
          >
            <span>Launch VAANI</span>
            <span style={{ fontSize: '24px' }}>→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '40px 24px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
        }}
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
          <span style={{ fontSize: '20px' }}>🔊</span>
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
      `}</style>

      {/* Floating Voice Navigation Button */}
      <div 
        role="button"
        aria-label={isVoiceNavListening ? 'Voice navigation बंद करें' : 'Voice navigation शुरू करें'}
        onClick={() => isVoiceNavListening ? stopVoiceNav() : startVoiceNav()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            isVoiceNavListening ? stopVoiceNav() : startVoiceNav();
          }
        }}
        tabIndex={0}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: isVoiceNavListening ? '#EF4444' : '#0F6E56',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          zIndex: 9999,
        }}
      >
        {isVoiceNavListening ? <MicOff size={24} color="white" /> : <Mic size={24} color="white" />}
      </div>
    </div>
  );
}

export default LandingPage;
