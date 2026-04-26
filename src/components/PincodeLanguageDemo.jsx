import { useState, useEffect, useRef } from 'react';

const PINCODES = {
  '110': { lang: 'Hindi', state: 'Delhi', code: 'hi' },
  '600': { lang: 'Tamil', state: 'Tamil Nadu', code: 'ta' },
  '781': { lang: 'Assamese', state: 'Assam', code: 'as' },
  '400': { lang: 'Marathi', state: 'Maharashtra', code: 'mr' },
  '700': { lang: 'Bengali', state: 'West Bengal', code: 'bn' },
  '462': { lang: 'Bhojpuri', state: 'Madhya Pradesh', code: 'bho' },
  '226': { lang: 'Awadhi', state: 'Uttar Pradesh', code: ' Awadhi' },
  '800': { lang: 'Maithili', state: 'Bihar', code: 'mai' },
  '302': { lang: 'Rajasthani', state: 'Rajasthan', code: 'raj' },
  '560': { lang: 'Kannada', state: 'Karnataka', code: 'kn' },
  '500': { lang: 'Telugu', state: 'Telangana', code: 'te' },
  '682': { lang: 'Malayalam', state: 'Kerala', code: 'ml' },
};

const GREETINGS = {
  Hindi:    'Namaskar! Main VAANI hoon. Aapka paisa surakshit rakhna mera kaam hai.',
  Tamil:    'வணக்கம்! நான் VAANI. உங்கள் பணத்தை பாதுகாக்க நான் இங்கே இருக்கிறேன்.',
  Assamese: 'নমস্কাৰ! মই VAANI। আপোনাৰ টকা সুৰক্ষিত ৰখাটো মোৰ কাম।',
  Bengali:  'নমস্কার! আমি VAANI। আপনার টাকা সুরক্ষিত রাখা আমার কাজ।',
  Marathi:  'नमस्कार! मी VAANI आहे. तुमचे पैसे सुरक्षित ठेवणे माझे काम आहे.',
  Bhojpuri: 'Pranam! Hum VAANI hain. Aapka paisa galla mein band rakhnaa hamar kaam ba.',
  Awadhi:   'Ram Ram! Hum VAANI hain. Aapka paisa mehfooz rakhna hamaar kaam hai.',
  Maithili: 'Pranam! Hum VAANI chhiyau. Apnek paisa surakshit rakhab hamaar kaam chhi.',
  Rajasthani: 'Khamma Ghani! Mhain VAANI chhu. Aapra paisa sambhalnu mharo kaam chhe.',
  Kannada:  'ನಮಸ್ಕಾರ! ನಾನು VAANI. ನಿಮ್ಮ ಹಣವನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಇಡುವುದು ನನ್ನ ಕೆಲಸ.',
  Telugu:   'నమస్కారం! నేను VAANI. మీ డబ్బును సురక్షితంగా ఉంచడం నా పని.',
  Malayalam:'നമസ്കാരം! ഞാൻ VAANI ആണ്. നിങ്ങളുടെ പണം സുരക്ഷിതമായി സൂക്ഷിക്കുക എന്റെ ജോലിയാണ്.',
};

const STATE_ICON = '🏛️';

export default function PincodeLanguageDemo() {
  const [pincode, setPincode] = useState('');
  const [detected, setDetected] = useState(null);
  const [displayText, setDisplayText] = useState('');
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [typewriterDone, setTypewriterDone] = useState(false);
  const typewriterRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (pincode.length === 6) {
      const prefix = pincode.slice(0, 3);
      const match = PINCODES[prefix];

      if (match) {
        setDetected(match);
        setBubbleVisible(false);
        setDisplayText('');
        setTypewriterDone(false);

        clearTimeout(typewriterRef.current);

        requestAnimationFrame(() => {
          setBubbleVisible(true);

          const greeting = GREETINGS[match.lang];
          if (!greeting) return;

          let i = 0;
          typewriterRef.current = setInterval(() => {
            setDisplayText(greeting.slice(0, i + 1));
            i++;
            if (i >= greeting.length) {
              clearInterval(typewriterRef.current);
              setTypewriterDone(true);
            }
          }, 40);
        });
      } else {
        setDetected({ lang: 'Unknown', state: 'Region not mapped', code: 'en' });
        setBubbleVisible(false);
        setDisplayText('');
        setTypewriterDone(false);
      }
    } else {
      setDetected(null);
      setBubbleVisible(false);
      setDisplayText('');
      setTypewriterDone(false);
      clearTimeout(typewriterRef.current);
    }
  }, [pincode]);

  useEffect(() => {
    return () => clearTimeout(typewriterRef.current);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(val);
  };

  return (
    <div style={{
      background: '#0F2E2B',
      borderRadius: '20px',
      padding: '28px 24px 24px',
      maxWidth: '420px',
      margin: '0 auto',
      fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif',
      position: 'relative',
    }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .bubble-animate {
          animation: slideUp 0.5s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
        }
        .badge-animate {
          animation: fadeIn 0.4s ease-out 0.3s both;
        }
        .cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: #FF6B00;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blink 1s step-end infinite;
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Try it now
        </p>
        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '4px 0 0', fontFamily: '"Noto Sans Devanagari", sans-serif' }}>
          Apna pincode daalo
        </h3>
      </div>

      {/* Input */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={pincode}
          onChange={handleChange}
          placeholder="110001"
          maxLength={6}
          style={{
            width: '100%',
            height: '56px',
            background: '#FFF8F0',
            borderRadius: '14px',
            border: 'none',
            outline: 'none',
            padding: '0 60px 0 20px',
            fontSize: '22px',
            fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif',
            fontWeight: 600,
            color: '#0F2E2B',
            letterSpacing: '4px',
            boxSizing: 'border-box',
            transition: 'box-shadow 0.2s ease',
          }}
          onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(255,107,0,0.35)'}
          onBlur={e => e.target.style.boxShadow = 'none'}
        />
        {pincode.length > 0 && (
          <span style={{
            position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
            color: pincode.length === 6 ? '#10B981' : 'rgba(15,46,43,0.4)',
            fontSize: '13px', fontWeight: 600,
          }}>
            {pincode.length}/6
          </span>
        )}
      </div>

      {/* Chat bubble */}
      {detected && (
        <div
          className="bubble-animate"
          style={{
            background: 'rgba(255,255,255,0.06)',
            borderLeft: '3px solid #FF6B00',
            borderRadius: '12px',
            padding: '16px 18px',
            marginBottom: '14px',
            minHeight: '80px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* VAANI label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0F6E56, #00D4AA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>V</div>
            <span style={{ color: '#00D4AA', fontSize: '13px', fontWeight: 700 }}>VAANI</span>
          </div>

          {/* Greeting text */}
          <p style={{
            color: '#fff', fontSize: '14px', lineHeight: 1.65,
            margin: 0, fontFamily: '"Noto Sans Devanagari", sans-serif',
            minHeight: '22px',
          }}>
            {displayText}
            {!typewriterDone && <span className="cursor" />}
          </p>
        </div>
      )}

      {/* Badges */}
      {detected && detected.lang !== 'Unknown' && (
        <div className="badge-animate" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            background: 'rgba(255,107,0,0.15)',
            border: '1px solid rgba(255,107,0,0.3)',
            borderRadius: '999px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#FF6B00',
          }}>
            🗣️ {detected.lang}
          </span>
          <span style={{
            background: 'rgba(0,212,170,0.1)',
            border: '1px solid rgba(0,212,170,0.2)',
            borderRadius: '999px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#00D4AA',
          }}>
            {STATE_ICON} {detected.state}
          </span>
        </div>
      )}

      {detected && detected.lang === 'Unknown' && (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0, fontFamily: '"Noto Sans Devanagari", sans-serif' }}>
          Could not detect region for pincode starting with "{pincode.slice(0, 3)}"
        </p>
      )}

      {/* Supported regions hint */}
      {!detected && (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0, lineHeight: 1.5 }}>
          Try: 110xxx (Delhi), 700xxx (Bengal), 400xxx (Maharashtra), 600xxx (Tamil Nadu), 560xxx (Karnataka)...
        </p>
      )}
    </div>
  );
}