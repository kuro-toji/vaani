import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { languages } from '../data/languages.js';

const MAJOR_LANGUAGES = [
  'hi', 'bn', 'te', 'mr', 'ta', 'ur', 'gu', 'kn', 'or', 'pa', 'ml',
  'as', 'mai', 'sa', 'sd', 'kok', 'ne', 'brx', 'sat', 'dgo', 'mni', 'ks', 'en'
];

export default function LanguageSelector({ language, onSelect, isManual }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const listboxRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const majorLanguages = languages.filter((lang) =>
    MAJOR_LANGUAGES.includes(lang.code)
  );

  const currentLanguage = languages.find((lang) => lang.code === language);

  // Calculate dropdown position when opening
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    updatePosition();
    const currentIdx = majorLanguages.findIndex(l => l.code === language);
    setActiveIndex(currentIdx >= 0 ? currentIdx : 0);
  }, [language, majorLanguages, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        listboxRef.current &&
        !listboxRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll('[role="option"]');
      items[activeIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeIndex, isOpen]);

  const handleSelect = useCallback((code) => {
    onSelect(code);
    setIsOpen(false);
    setActiveIndex(-1);
  }, [onSelect]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev =>
          prev < majorLanguages.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev =>
          prev > 0 ? prev - 1 : majorLanguages.length - 1
        );
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(majorLanguages.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < majorLanguages.length) {
          handleSelect(majorLanguages[activeIndex].code);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  }, [isOpen, activeIndex, majorLanguages, handleSelect, handleOpen]);

  const getDisplayText = () => {
    if (!currentLanguage) return 'भाषा';
    if (isManual === false) {
      return `Auto: ${currentLanguage.nativeName}`;
    }
    return currentLanguage.nativeName;
  };

  const trigger = (
    <div ref={triggerRef} onKeyDown={handleKeyDown} style={{ display: 'inline-flex' }}>
      {/* Pill trigger */}
      <button
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="भाषा चुनें - Select language"
        aria-controls="language-listbox"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#E1F5EE',
          color: '#0F6E56',
          fontSize: '12px',
          padding: '6px 12px',
          borderRadius: '999px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          minWidth: '48px',
          minHeight: '36px',
          justifyContent: 'center',
          transition: 'background 0.15s',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#d1e9df'}
        onMouseLeave={e => e.currentTarget.style.background = '#E1F5EE'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0 3-4.03 3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
        <span>{getDisplayText()}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );

  const dropdown = isOpen && createPortal(
    <div
      ref={listboxRef}
      id="language-listbox"
      role="listbox"
      aria-label="भाषा चुनें - Select your language"
      aria-orientation="vertical"
      style={{
        position: 'fixed',
        top: dropdownPos.top,
        left: Math.min(dropdownPos.left, window.innerWidth - 200),
        width: '200px',
        maxHeight: '65vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        zIndex: 99999,
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        scrollPadding: '4px',
        padding: '4px 0',
      }}
    >
      {majorLanguages.map((lang, index) => (
        <button
          key={lang.code}
          id={`lang-option-${lang.code}`}
          onClick={() => handleSelect(lang.code)}
          role="option"
          aria-selected={lang.code === language}
          tabIndex={activeIndex === index ? 0 : -1}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '10px 14px',
            fontSize: '14px',
            background: lang.code === language ? '#E1F5EE' : activeIndex === index ? '#f3f4f6' : 'transparent',
            color: lang.code === language ? '#0F6E56' : '#374151',
            fontWeight: lang.code === language ? 600 : 400,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.1s',
            touchAction: 'manipulation',
          }}
          onMouseEnter={e => {
            if (lang.code !== language) e.currentTarget.style.background = '#f9fafb';
          }}
          onMouseLeave={e => {
            if (lang.code !== language && activeIndex !== index) e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ fontWeight: 500, flex: 1 }}>{lang.nativeName}</span>
          <span style={{ color: '#9ca3af', fontSize: '11px' }}>{lang.name}</span>
        </button>
      ))}
    </div>,
    document.body
  );

  return (
    <>
      {trigger}
      {dropdown}
    </>
  );
}
