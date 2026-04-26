import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'hi',  name: 'Hindi',       native: 'हिन्दी',      region: 'Delhi' },
  { code: 'bho', name: 'Bhojpuri',    native: 'भोजपुरी',    region: 'UP' },
  { code: 'bn',  name: 'Bengali',     native: 'বাংলা',        region: 'West Bengal' },
  { code: 'ta',  name: 'Tamil',       native: 'தமிழ்',        region: 'Tamil Nadu' },
  { code: 'te',  name: 'Telugu',      native: 'తెలుగు',       region: 'Telangana' },
  { code: 'mr',  name: 'Marathi',     native: 'मराठी',        region: 'Maharashtra' },
  { code: 'kn',  name: 'Kannada',     native: 'ಕನ್ನಡ',       region: 'Karnataka' },
  { code: 'ml',  name: 'Malayalam',   native: 'മലയാളം',      region: 'Kerala' },
  { code: 'as',  name: 'Assamese',    native: 'অসমীয়া',      region: 'Assam' },
  { code: 'raj', name: 'Rajasthani',  native: 'राजस्थानी',   region: 'Rajasthan' },
  { code: 'mai', name: 'Maithili',    native: 'মৈথিলী',      region: 'Bihar' },
  { code: 'en',  name: 'English',     native: 'English',      region: 'General' },
];

export default function LanguageDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find(l => l.code === value) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
          color: '#FF6B00', fontSize: '12px', fontWeight: 600,
          fontFamily: '"Noto Sans Devanagari", sans-serif',
        }}
      >
        <Globe size={12} color="#FF6B00" />
        {current.native}
        <ChevronDown size={12} color="rgba(255,255,255,0.5)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              background: '#0F2E2B', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '6px', zIndex: 100,
              minWidth: '160px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { onChange(lang.code); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '8px 12px', borderRadius: '8px',
                  background: value === lang.code ? 'rgba(255,107,0,0.15)' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (value !== lang.code) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (value !== lang.code) e.currentTarget.style.background = 'transparent'; }}
              >
                <div>
                  <div style={{ color: value === lang.code ? '#FF6B00' : '#fff', fontSize: '13px', fontWeight: 600 }}>{lang.native}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>{lang.name} · {lang.region}</div>
                </div>
                {value === lang.code && (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00' }} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}