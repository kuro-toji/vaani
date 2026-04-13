import { useState, useEffect, useRef, useCallback } from 'react';
import { useCognitiveMode } from '../context/CognitiveModeContext';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { Mic, MicOff } from 'lucide-react';

/**
 * CognitiveDashboard — Full-screen traffic light UI for cognitively impaired users.
 * 
 * Three states: green (safe), yellow (attention needed), red (warning).
 * Entire screen is tappable for motor-impaired users.
 * Minimum 24px font size throughout, high contrast.
 */
export default function CognitiveDashboard() {
  const { toggleCognitiveMode, financialStatus, setFinancialStatus } = useCognitiveMode();
  const { messages, isLoading, sendMessage } = useChat();
  const { isListening, startListening, stopListening } = useVoice();
  const [statusMessage, setStatusMessage] = useState('अपनी बात बोलिए');
  const [transcript, setTranscript] = useState('');
  const isRecording = isListening;

  // Determine financial status from messages
  useEffect(() => {
    if (!messages || messages.length <= 2) {
      // No real messages yet (only greeting) — default to green
      setFinancialStatus('green');
      return;
    }

    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMsg = userMessages[userMessages.length - 1]?.content?.toLowerCase() || '';

    // Red triggers: emergency, danger keywords
    const redKeywords = ['आपातकाल', 'emergency', 'मर', 'कर्ज', 'लोन', 'कर्जा', 'खतरा', 'नुकसान', 'चीट', 'fraud', 'scam'];
    if (redKeywords.some(kw => lastUserMsg.includes(kw))) {
      setFinancialStatus('red');
      return;
    }

    // Yellow triggers: life events needing planning
    const yellowKeywords = ['शादी', 'बच्चे', 'विवाह', 'पढ़ाई', 'इलाज', 'घर', 'home loan', 'wedding', 'hospital'];
    if (yellowKeywords.some(kw => lastUserMsg.includes(kw))) {
      setFinancialStatus('yellow');
      return;
    }

    // Default: green
    setFinancialStatus('green');
  }, [messages, setFinancialStatus]);

  // Get last AI recommendation for yellow/red states
  const lastAiMessage = messages?.filter(m => m.role === 'assistant').pop();
  const lastRecommendation = lastAiMessage?.content?.substring(0, 120) || '';

  const handleMicClick = useCallback(async () => {
    if (isRecording) {
      stopListening();
      setStatusMessage('सोच रहा हूं...');
    } else {
      setTranscript('');
      setStatusMessage('सुन रहा हूं...');
      startListening(
        (text, isFinal) => {
          if (isFinal) {
            setTranscript(text);
          }
        },
        (error) => {
          console.error('STT error:', error);
          setStatusMessage('समझ नहीं आया, फिर से बोलिए');
        },
        'hi'
      );
    }
  }, [isRecording, stopListening, startListening]);

  // Auto-send when transcript is ready
  useEffect(() => {
    if (transcript && transcript.trim() && !isLoading) {
      sendMessage(transcript);
      setTranscript('');
      setStatusMessage('जवाब आ रहा है...');
    }
  }, [transcript, isLoading, sendMessage]);

  // Status display config
  const STATUS = {
    green: {
      color: '#10B981',
      shadow: '0 0 60px rgba(16, 185, 129, 0.5)',
      title: 'अच्छा है ✓',
      subtext: 'आपका पैसा बढ़ रहा है',
      defaultSubtext: 'आपका पैसा सुरक्षित है',
      buttonText: 'Vaani से पूछें',
    },
    yellow: {
      color: '#F59E0B',
      shadow: '0 0 60px rgba(245, 158, 11, 0.5)',
      title: 'ध्यान दें ⚠',
      subtext: 'कुछ सुझाव हैं',
      buttonText: 'Vaani से पूछें',
    },
    red: {
      color: '#EF4444',
      shadow: '0 0 60px rgba(239, 68, 68, 0.5)',
      title: 'जरूरी है !',
      subtext: lastRecommendation || 'तुरंत ध्यान दें',
      buttonText: 'Vaani से बात करें',
    },
  };

  const status = financialStatus || 'green';
  const current = STATUS[status] || STATUS.green;
  const hasRealMessages = messages && messages.length > 2;

  // Tap anywhere handler for motor-impaired users
  const handleScreenTap = useCallback(() => {
    toggleCognitiveMode();
  }, [toggleCognitiveMode]);

  return (
    <div
      onClick={handleScreenTap}
      role="button"
      tabIndex={0}
      aria-label="Vaani चैट पर जाएं — कहीं भी टैप करें"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleScreenTap(); }}
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
        padding: '32px 24px',
        gap: '32px',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
    >
      {/* Back button — prevent event propagation */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleCognitiveMode(); }}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '14px 24px',
          backgroundColor: 'rgba(255,255,255,0.15)',
          border: 'none',
          borderRadius: '16px',
          fontSize: '24px',
          cursor: 'pointer',
          color: '#fff',
        }}
        aria-label="विस्तृत मोड पर जाएं"
      >
        विस्तृत मोड ↗
      </button>

      {/* Large status circle */}
      <div
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          backgroundColor: current.color,
          boxShadow: current.shadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.5s ease',
          animation: status === 'red' ? 'pulseGlow 1.5s ease-in-out infinite' : 'none',
        }}
      >
        <span style={{ fontSize: '64px', lineHeight: 1 }}>
          {status === 'green' ? '✓' : status === 'yellow' ? '⚠' : '!'}
        </span>
      </div>

      {/* Title */}
      <div style={{
        fontSize: '48px',
        fontWeight: 700,
        color: current.color,
        textAlign: 'center',
        lineHeight: 1.2,
      }}>
        {current.title}
      </div>

      {/* Subtext */}
      <div style={{
        fontSize: '28px',
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        maxWidth: '360px',
        lineHeight: 1.5,
      }}>
        {!hasRealMessages ? current.defaultSubtext || current.subtext : current.subtext}
      </div>

      {/* Last AI recommendation for yellow/red */}
      {hasRealMessages && status !== 'green' && lastRecommendation && (
        <div style={{
          fontSize: '24px',
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
          maxWidth: '400px',
          padding: '16px 20px',
          borderRadius: '16px',
          backgroundColor: 'rgba(255,255,255,0.08)',
          lineHeight: 1.5,
        }}>
          🤖 {lastRecommendation}{lastRecommendation.length >= 120 ? '...' : ''}
        </div>
      )}

      {/* Encouragement for new users */}
      {!hasRealMessages && (
        <div style={{
          fontSize: '24px',
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
          maxWidth: '320px',
          lineHeight: 1.5,
        }}>
          नीचे माइक दबाकर बात शुरू करें 👇
        </div>
      )}

      {/* Large PTT Mic Button — prevent event propagation */}
      <button
        onClick={(e) => { e.stopPropagation(); handleMicClick(); }}
        disabled={isLoading}
        style={{
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          backgroundColor: isRecording ? '#EF4444' : '#10B981',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isRecording
            ? '0 0 50px rgba(239, 68, 68, 0.6)'
            : '0 0 50px rgba(16, 185, 129, 0.4)',
          transition: 'all 0.2s ease',
          transform: isRecording ? 'scale(1.1)' : 'scale(1)',
          flexShrink: 0,
        }}
        aria-label={isRecording ? 'रिकॉर्डिंग बंद करें' : 'बोलें'}
      >
        {isRecording ? (
          <MicOff size={56} color="white" />
        ) : (
          <Mic size={56} color="white" />
        )}
      </button>

      {/* Status message */}
      <div style={{
        fontSize: '28px',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
      }}>
        {statusMessage}
      </div>

      {/* CTA text */}
      <div style={{
        fontSize: '24px',
        color: current.color,
        fontWeight: 600,
        textAlign: 'center',
      }}>
        {current.buttonText}
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 60px rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 100px rgba(239, 68, 68, 0.8); }
        }
      `}</style>
    </div>
  );
}
