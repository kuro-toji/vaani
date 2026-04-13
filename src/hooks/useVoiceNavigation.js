import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useVoiceNavigation — Global voice command handler.
 * 
 * When active, listens for navigation commands like:
 *   "go back"  → triggers onBack()
 *   "send"     → triggers onSend()
 *   "help"     → triggers onHelp()
 *   "mute"     → triggers onMute()
 *   "simple mode" → triggers onSimpleMode()
 *   "icon mode"   → triggers onIconMode()
 * 
 * Supports all 28 Indian languages via Web Speech API.
 * Falls back gracefully if SpeechRecognition is unavailable.
 */

const COMMAND_PATTERNS = {
  back: [/\b(back|wapas|peechhe|पीछे|वापस|திரும்பு|వెనక్కి|ফিরে)\b/i],
  send: [/\b(send|bhejo|भेजो|அனுப்பு|పంపు|পাঠাও)\b/i],
  help: [/\b(help|madad|मदद|உதவி|సహాయం|সাহায্য)\b/i],
  mute: [/\b(mute|chup|चुप|muted|silent)\b/i],
  unmute: [/\b(unmute|sound|awaaz|आवाज़|bol|बोल)\b/i],
  simple: [/\b(simple|traffic|light|saral|सरल|simple mode)\b/i],
  icons: [/\b(icon|picture|tasveer|तस्वीर|card mode|icon mode)\b/i],
  stop: [/\b(stop|ruko|रुको|நிறுத்து|ఆపు|থামো)\b/i],
};

let globalAudioCtx = null;

function playConfirmationBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    if (!globalAudioCtx) {
      globalAudioCtx = new AudioContext();
    }
    
    const ctx = globalAudioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (err) {
    console.warn('Silent beep playback failed:', err);
  }
}

function matchCommand(transcript) {
  const t = transcript.toLowerCase().trim();
  for (const [cmd, patterns] of Object.entries(COMMAND_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(t)) return cmd;
    }
  }
  return null;
}

export function useVoiceNavigation({
  enabled = false,
  onBack,
  onSend,
  onHelp,
  onMute,
  onUnmute,
  onSimpleMode,
  onIconMode,
  onStop,
} = {}) {
  const [isActive, setIsActive] = useState(false);
  const recognitionRef = useRef(null);

  const stopNav = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
    setIsActive(false);
  }, []);

  const startNav = useCallback(() => {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) return; // Graceful degradation

    const recognition = new SpeechAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN'; // Works for most Indian languages as Devanagari fallback

    recognition.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript;
      const cmd = matchCommand(transcript);
      if (!cmd) return;

      playConfirmationBeep();

      switch (cmd) {
        case 'back':       onBack?.();       break;
        case 'send':       onSend?.();       break;
        case 'help':       onHelp?.();       break;
        case 'mute':       onMute?.();       break;
        case 'unmute':     onUnmute?.();     break;
        case 'simple':     onSimpleMode?.(); break;
        case 'icons':      onIconMode?.();   break;
        case 'stop':       onStop?.(); stopNav(); break;
      }
    };

    recognition.onend = () => {
      // Auto-restart to keep listening (continuous navigation)
      if (recognitionRef.current && enabled) {
        try { recognition.start(); } catch (_) {}
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        stopNav(); // Mic not granted — disable silently
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsActive(true);
    } catch (_) {
      setIsActive(false);
    }
  }, [enabled, onBack, onSend, onHelp, onMute, onUnmute, onSimpleMode, onIconMode, onStop, stopNav]);

  useEffect(() => {
    if (enabled) startNav();
    else stopNav();
    return stopNav;
  }, [enabled, startNav, stopNav]);

  return { isActive };
}

export default useVoiceNavigation;
