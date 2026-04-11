import { useState, useEffect, useRef } from 'react';
import { languages } from '../data/languages.js';

const MAJOR_LANGUAGES = [
  'hi', 'bn', 'te', 'mr', 'ta', 'ur', 'gu', 'kn', 'or', 'pa', 'ml', 
  'as', 'mai', 'sa', 'sd', 'kok', 'ne', 'brx', 'sat', 'dgo', 'mni', 'ks'
];

export default function LanguageSelector({ language, onSelect, isManual }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const majorLanguages = languages.filter((lang) =>
    MAJOR_LANGUAGES.includes(lang.code)
  );

  const currentLanguage = languages.find((lang) => lang.code === language);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    onSelect(code);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (!currentLanguage) return 'भाषा';
    if (isManual === false) {
      return `Auto: ${currentLanguage.nativeName}`;
    }
    return currentLanguage.nativeName;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Pill trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-[#E1F5EE] text-[#0F6E56] text-xs px-3 py-1 rounded-full font-medium hover:bg-[#d1e9df] transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
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
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] py-1">
          {majorLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                lang.code === language ? 'bg-[#E1F5EE] text-[#0F6E56] font-medium' : 'text-gray-700'
              }`}
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
