import { useState, useRef, useEffect } from 'react';
import { languages } from '../../data/languages.js';

/**
 * LanguageDropdown — compact dropdown to change chat language.
 */
export default function LanguageDropdown({ language, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-secondary btn-sm"
        aria-label="Change language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        {currentLang.nativeName}
      </button>

      {open && (
        <div className="lang-dropdown" role="listbox" aria-label="Select language">
          {languages.map(lang => (
            <button
              key={lang.code}
              role="option"
              aria-selected={lang.code === language}
              onClick={() => { onSelect(lang.code); setOpen(false); }}
              className="w-full flex items-center gap-2"
              style={{
                width: '100%', textAlign: 'left',
                background: lang.code === language ? 'var(--primary-muted)' : 'transparent',
                border: 'none',
                color: lang.code === language ? 'var(--primary)' : 'var(--text-primary)',
                padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                fontSize: '13px', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-elevated-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = lang.code === language ? 'var(--primary-muted)' : 'transparent'}
            >
              <span>{lang.nativeName}</span>
              <span className="ml-auto text-xs" style={{ color: 'var(--text-tertiary)' }}>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}