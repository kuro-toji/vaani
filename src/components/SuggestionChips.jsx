import { getLanguageChips } from '../data/languages.js';
import { useAccessibility } from '../context/AccessibilityContext.jsx';

const SuggestionChips = ({ language, onSend }) => {
  const chips = getLanguageChips(language);
  const { highContrast, largeText } = useAccessibility();

  const WELCOME_TEXT = {
    hi: { greeting: 'नमस्ते! 🙏', sub: 'बोलिए या नीचे से चुनें:' },
    en: { greeting: 'Hello! 👋', sub: 'Speak or choose below:' },
    bn: { greeting: 'হ্যালো! 🙏', sub: 'বলুন বা নিচে থেকে বেছে নিন:' },
    te: { greeting: 'నమస్కారం! 🙏', sub: 'మాట్లాడండి లేదా దిగువ నుండి ఎంచుకోండి:' },
    ta: { greeting: 'வணக்கம்! 🙏', sub: 'பேசுங்கள் அல்லது கீழே தேர்ந்தெடுங்கள்:' },
    mr: { greeting: 'नमस्कार! 🙏', sub: 'बोला किंवा खाली निवडा:' },
    gu: { greeting: 'નમસ્તે! 🙏', sub: 'બોલો અથવા નીચેથી પસંદ કરો:' },
    kn: { greeting: 'ನಮಸ್ಕಾರ! 🙏', sub: 'ಮಾತನಾಡಿ ಅಥವಾ ಕೆಳಗಿನಿಂದ ಆಯ್ಕೆ ಮಾಡಿ:' },
    ml: { greeting: 'നമസ്കാരം! 🙏', sub: 'സംസാരിക്കൂ അല്ലെങ്കിൽ താഴെ തിരഞ്ഞെടുക്കൂ:' },
    pa: { greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! 🙏', sub: 'ਬੋਲੋ ਜਾਂ ਹੇਠਾਂ ਤੋਂ ਚੁਣੋ:' },
    ur: { greeting: 'آداب! 🙏', sub: 'بولیے یا نیچے سے چنیے:' },
    or: { greeting: 'ନମସ୍କାର! 🙏', sub: 'ବୋଲନ୍ତୁ ବା ତଳରୁ ବାଛନ୍ତୁ:' },
    as: { greeting: 'নমস্কাৰ! 🙏', sub: 'কওক বা তলৰ পৰা বাছক:' },
    mni: { greeting: 'খুরুমজরি! 🙏', sub: 'হায়বিয়ু অয়ু ম্পাং লৈনবা থারক:' },
  };
  const wt = WELCOME_TEXT[language] || WELCOME_TEXT.hi;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '16px', padding: '32px 16px',
      animation: 'messageSlideIn 0.5s ease forwards',
    }}>
      {/* Welcome Message */}
      <div style={{
        width: '56px', height: '56px', borderRadius: '50%',
        background: highContrast ? '#000000' : 'linear-gradient(135deg, #0F6E56, #10B981)',
        border: highContrast ? '2px solid #00FF88' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px',
        boxShadow: highContrast ? '0 0 0 0' : '0 4px 16px rgba(15, 110, 86, 0.3)',
        animation: 'pulse 2s ease-in-out infinite',
      }}>🔊</div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: highContrast ? '#FFFFFF' : '#111827', marginBottom: '4px' }}>
          {wt.greeting}
        </h2>
        <p style={{ fontSize: '14px', color: highContrast ? 'rgba(255,255,255,0.8)' : '#6B7280' }}>
          {wt.sub}
        </p>
      </div>

      <div 
        role="list" 
        aria-label="सुझाव"
        style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}
      >
        {chips.map((chip, index) => (
          <button
            key={index}
            onClick={() => onSend(chip)}
            role="listitem"
            className={`suggestion-chip${highContrast ? ' high-contrast' : ''}`}
            style={{
              fontSize: largeText ? '18px' : '14px',
              animationDelay: `${index * 0.1}s`,
              animation: 'messageSlideIn 0.4s ease forwards',
              opacity: 0,
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes messageSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default SuggestionChips;