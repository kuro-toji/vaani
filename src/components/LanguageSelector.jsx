import { useState, useEffect, useRef, useCallback } from 'react';
import { languages } from '../data/languages.js';

const MAJOR_LANGUAGES = [
  'hi', 'bn', 'te', 'mr', 'ta', 'ur', 'gu', 'kn', 'or', 'pa', 'ml', 
  'as', 'mai', 'sa', 'sd', 'kok', 'ne', 'brx', 'sat', 'dgo', 'mni', 'ks', 'en'
];

export default function LanguageSelector({ language, onSelect, isManual }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const listboxRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const majorLanguages = languages.filter((lang) =>
    MAJOR_LANGUAGES.includes(lang.code)
  );

  const currentLanguage = languages.find((lang) => lang.code === language);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((code) => {
    onSelect(code);
    setIsOpen(false);
    setActiveIndex(-1);
  }, [onSelect]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        // Focus first selected or first item
        const currentIdx = majorLanguages.findIndex(l => l.code === language);
        setActiveIndex(currentIdx >= 0 ? currentIdx : 0);
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
  }, [isOpen, activeIndex, majorLanguages, language, handleSelect]);

  // Focus active item when activeIndex changes
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll('[role="option"]');
      items[activeIndex]?.focus();
    }
  }, [activeIndex, isOpen]);

  const getDisplayText = () => {
    if (!currentLanguage) return 'भाषा';
    if (isManual === false) {
      return `Auto: ${currentLanguage.nativeName}`;
    }
    return currentLanguage.nativeName;
  };

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      {/* Pill trigger */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            const currentIdx = majorLanguages.findIndex(l => l.code === language);
            setActiveIndex(currentIdx >= 0 ? currentIdx : 0);
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="भाषा चुनें - Select language"
        aria-controls="language-listbox"
        className="flex items-center gap-1.5 bg-[#E1F5EE] text-[#0F6E56] text-xs px-3 py-1.5 rounded-full font-medium hover:bg-[#d1e9df] transition-colors"
        style={{ minWidth: '48px', minHeight: '36px' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
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
          className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={listboxRef}
          id="language-listbox"
          role="listbox" 
          aria-label="भाषा चुनें - Select your language"
          aria-orientation="vertical"
          className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] py-1 max-h-[60vh] overflow-y-auto overscroll-contain"
          style={{ zIndex: 9999 }}
        >
          {majorLanguages.map((lang, index) => (
            <button
              key={lang.code}
              id={`lang-option-${lang.code}`}
              onClick={() => handleSelect(lang.code)}
              role="option"
              aria-selected={lang.code === language}
              tabIndex={activeIndex === index ? 0 : -1}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                lang.code === language ? 'bg-[#E1F5EE] text-[#0F6E56] font-medium' : 'text-gray-700'
              } ${activeIndex === index ? 'bg-gray-100' : ''}`}
            >
              <span className="font-medium mr-2">{lang.nativeName}</span>
              <span className="text-gray-500 text-xs">({lang.name})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
