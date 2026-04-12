import { useState, useEffect, useRef, useCallback } from 'react';
import { useCognitiveMode } from '../context/CognitiveModeContext';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { Mic, MicOff } from 'lucide-react';
import { detectLifeEvents, buildInvestmentLadder } from '../services/lifeEventService';

export default function CognitiveDashboard() {
  const { cognitiveMode, toggleCognitiveMode, financialStatus, setFinancialStatus } = useCognitiveMode();
  const { messages, isLoading, sendMessage } = useChat();
  const { isListening, startListening, stopListening } = useVoice();
  const [statusMessage, setStatusMessage] = useState('अपनी बात बोलिए');
  const [transcript, setTranscript] = useState('');
  const [activeLadder, setActiveLadder] = useState(null);
  const messagesEndRef = useRef(null);
  const isRecording = isListening;

  // Analyze financial status from messages
  useEffect(() => {
    // Simple heuristic based on conversation
    // In real app, this would be ML-based
    if (messages && messages.length > 0) {
      // 1. Detect Financial Status
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage?.content.includes('शादी') || lastUserMessage?.content.includes('बच्चे') || lastUserMessage?.content.includes('विवाह')) {
        setFinancialStatus('yellow');
      } else if (lastUserMessage?.content.includes('आपातकाल') || lastUserMessage?.content.includes('emergency') || lastUserMessage?.content.includes('मर')) {
        setFinancialStatus('red');
      } else {
        setFinancialStatus('green');
      }

      // 2. Detect Life Events and Build Ladder
      const event = detectLifeEvents(messages);
      if (event) {
        const ladder = buildInvestmentLadder(event);
        setActiveLadder(ladder);
      }
    }
  }, [messages, setFinancialStatus]);

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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const statusColors = {
    green: { bg: '#10B981', shadow: '0 0 30px rgba(16, 185, 129, 0.5)' },
    yellow: { bg: '#F59E0B', shadow: '0 0 30px rgba(245, 158, 11, 0.5)' },
    red: { bg: '#EF4444', shadow: '0 0 30px rgba(239, 68, 68, 0.5)' },
  };

  const statusLabels = {
    green: '✅ आप ठीक हैं',
    yellow: '⚠️ ध्यान दें',
    red: '🚨 काम करें',
  };

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--vaani-bg)',
      padding: '20px',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--vaani-text)' }}>
          Vaani
        </span>
        <button
          onClick={toggleCognitiveMode}
          style={{
            padding: '12px 20px',
            backgroundColor: 'var(--vaani-border)',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            cursor: 'pointer',
            color: 'var(--vaani-text)',
          }}
        >
          विस्तृत मोड ↗
        </button>
      </div>

      {/* Traffic Light Status */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '30px',
      }}>
        {/* Large Traffic Light */}
        <div style={{
          width: '120px',
          height: '320px',
          backgroundColor: '#1F2937',
          borderRadius: '60px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: financialStatus !== 'unknown' ? statusColors[financialStatus].shadow : 'none',
        }}>
          {/* Green */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: financialStatus === 'green' ? '#10B981' : '#374151',
            transition: 'all 0.3s ease',
          }} />
          {/* Yellow */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: financialStatus === 'yellow' ? '#F59E0B' : '#374151',
            transition: 'all 0.3s ease',
          }} />
          {/* Red */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: financialStatus === 'red' ? '#EF4444' : '#374151',
            transition: 'all 0.3s ease',
          }} />
        </div>

        {/* Status Label */}
        <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'var(--vaani-text)',
          textAlign: 'center',
        }}>
          {statusLabels[financialStatus] || 'Vaani शुरू करें'}
        </div>

        {/* Large PTT Button */}
        <button
          onClick={handleMicClick}
          disabled={isLoading}
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            backgroundColor: isRecording ? '#EF4444' : '#10B981',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isRecording 
              ? '0 0 40px rgba(239, 68, 68, 0.6)' 
              : '0 0 40px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.2s ease',
            transform: isRecording ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {isRecording ? (
            <MicOff size={64} color="white" />
          ) : (
            <Mic size={64} color="white" />
          )}
        </button>

        {/* Status Message */}
        <div style={{
          fontSize: '24px',
          color: 'var(--vaani-text)',
          opacity: 0.8,
        }}>
          {statusMessage}
        </div>
      </div>

      {/* Investment Ladder Display */}
      {activeLadder && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '20px',
          margin: '20px 0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--vaani-border)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#0F6E56', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📈</span> {activeLadder.title}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeLadder.allocations.map((alloc, idx) => (
              <div key={idx} style={{ 
                backgroundColor: '#F3F4F6', 
                padding: '12px 16px', 
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>{alloc.purpose}</div>
                  <div style={{ color: '#4B5563', fontSize: '14px' }}>{alloc.instrument} • {alloc.timeline}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#0F6E56', fontSize: '16px' }}>{alloc.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simple Messages */}
      <div style={{
        maxHeight: '200px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        backgroundColor: 'var(--vaani-ai-bubble-bg)',
        borderRadius: '16px',
      }}>
        {messages.slice(-4).map((msg) => (
          <div key={msg.id} style={{
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: msg.role === 'user' 
              ? 'var(--vaani-user-bubble)' 
              : 'var(--vaani-ai-bubble-bg)',
            color: msg.role === 'user' ? 'white' : 'var(--vaani-text)',
            fontSize: '18px',
            maxWidth: '85%',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {msg.role === 'user' ? '👤 ' : '🤖 '}
            {msg.content.substring(0, 100)}
            {msg.content.length > 100 ? '...' : ''}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
