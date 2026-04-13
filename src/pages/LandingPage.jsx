import { useState, useEffect, useRef } from 'react';
import { Mic, Globe, Shield, Zap, ChevronDown } from 'lucide-react';
import { languages } from '../data/languages.js';
import { getRegionByPincode } from '../services/pincodeService.js';

export default function LandingPage({ onStart }) {
  const [pincode, setPincode] = useState('');
  const [region, setRegion] = useState(null);
  const [detectedLang, setDetectedLang] = useState('हिन्दी');
  const [selectedLangIndex, setSelectedLangIndex] = useState(0);
  
  // Detect region from pincode
  useEffect(() => {
    if (pincode.length === 6) {
      const data = getRegionByPincode(pincode);
      if (data) {
        setRegion(data);
        setDetectedLang(data.language);
      }
    } else {
      setRegion(null);
    }
  }, [pincode]);

  const handleLanguageSelect = (lang, index) => {
    setSelectedLangIndex(index);
    setDetectedLang(lang.name);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00D4AA] to-[#10B981] bg-clip-text text-transparent">
            VAANI
          </h1>
          <button
            onClick={onStart}
            className="px-6 py-2 bg-[#10B981] hover:bg-[#0F6E56] rounded-full font-semibold transition-all"
          >
            शुरू करें
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Your Language.<br />Your Voice.
          </h2>
          <p className="text-lg text-white/70 mb-10">
            28 Indian languages में financial guidance। बिना पढ़े, बिना लिखे।
          </p>

          {/* Big Mic Button */}
          <button
            onClick={onStart}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-[#10B981] to-[#0F6E56] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#10B981]/30 hover:scale-105 transition-transform"
          >
            <Mic size={48} className="text-white" />
          </button>
          <p className="text-white/50 text-sm mb-8">Tap to Speak</p>

          {/* Pincode Input */}
          <div className="max-w-md mx-auto">
            <label className="block text-sm text-white/60 mb-2">
              Enter pincode (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="110001"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00D4AA]"
                maxLength={6}
              />
              {region && (
                <div className="px-4 py-3 bg-[#10B981]/20 border border-[#10B981]/40 rounded-xl text-sm">
                  {region.region}
                </div>
              )}
            </div>
            {region && (
              <p className="text-sm text-[#00D4AA] mt-2">
                Detected: {region.language}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Language Selection */}
      <section className="py-16 px-4 bg-white/5">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-center mb-8">
            Choose Your Language
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {languages.slice(0, 12).map((lang, index) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang, index)}
                className={`px-4 py-3 rounded-xl text-center transition-all ${
                  selectedLangIndex === index
                    ? 'bg-[#10B981] text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/80'
                }`}
              >
                <div className="text-lg mb-1">{lang.flag}</div>
                <div className="text-xs">{lang.name}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-center mb-8">
            Why VAANI?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="text-[#10B981]" size={24} />
              </div>
              <h4 className="font-semibold mb-2">28 Languages</h4>
              <p className="text-sm text-white/60">
                Hindi, Tamil, Telugu, Bengali, Marathi & more
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="text-[#10B981]" size={24} />
              </div>
              <h4 className="font-semibold mb-2">Voice First</h4>
              <p className="text-sm text-white/60">
                Speak in your language, get answers in your language
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-[#10B981]" size={24} />
              </div>
              <h4 className="font-semibold mb-2">Private & Secure</h4>
              <p className="text-sm text-white/60">
                Your data stays on your device
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h3 className="text-3xl font-bold mb-4">Ready to start?</h3>
        <p className="text-white/60 mb-8">No account needed. Just speak.</p>
        <button
          onClick={onStart}
          className="px-8 py-4 bg-[#10B981] hover:bg-[#0F6E56] rounded-full font-semibold text-lg transition-all hover:scale-105"
        >
          Start VAANI Free
        </button>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10 text-center text-sm text-white/40">
        <p>VAANI © 2026 • Built for India</p>
      </footer>
    </div>
  );
}
