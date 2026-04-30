import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice.js';

/**
 * ChatInput — text input + push-to-talk mic button.
 * Auto-resizes textarea, shows confirmation modal for voice input.
 */
export default function ChatInput({ onSend, isLoading, language, isMuted, onSpeak }) {
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [transcribed, setTranscribed] = useState('');
  const textareaRef = useRef(null);

  const {
    isListening, isModelLoading, sttError,
    startListening, stopListening,
  } = useVoice();

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [message]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartListening = () => {
    startListening(
      (transcript, isFinal) => {
        if (isFinal) {
          setTranscribed(transcript);
          setShowConfirm(true);
        }
      },
      (error) => console.warn('STT error:', error),
      language
    );
  };

  const handleMicClick = isListening ? stopListening : handleStartListening;

  const hasContent = message.trim().length > 0;

  return (
    <>
      <div className="flex items-end gap-3">
        {/* Text area */}
        <div
          className="flex-1 flex items-end rounded-2xl px-4 py-3"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            transition: 'border-color 0.2s',
          }}
        >
          <textarea
            ref={textareaRef}
            dir="auto"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Vaani se baat karo..."
            disabled={isLoading}
            maxLength={5000}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              fontSize: '15px',
              resize: 'none',
              outline: 'none',
              border: 'none',
              minHeight: '24px',
              maxHeight: '120px',
              lineHeight: '24px',
              fontFamily: 'inherit',
              color: 'var(--text-primary)',
            }}
            aria-label="Type your message"
          />
        </div>

        {/* Mic button */}
        <button
          onClick={handleMicClick}
          disabled={isLoading || isMuted || isModelLoading}
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: '44px', height: '44px',
            border: 'none',
            cursor: isLoading || isMuted || isModelLoading ? 'not-allowed' : 'pointer',
            background: isListening
              ? 'var(--danger)'
              : isMuted
                ? 'var(--bg-elevated)'
                : 'var(--primary)',
            boxShadow: isListening
              ? '0 0 0 4px rgba(239,68,68,0.2)'
              : '0 2px 8px rgba(29,158,117,0.3)',
            opacity: isModelLoading ? 0.5 : 1,
            animation: isListening ? 'pulseGlow 1.5s ease-in-out infinite' : 'none',
            transition: 'all 0.2s var(--ease-spring)',
          }}
          aria-label={isModelLoading ? 'Model loading...' : isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isModelLoading ? (
            <span style={{ color: '#fff', fontSize: '12px' }}>...</span>
          ) : isListening ? (
            <MicOff size={18} color="#fff" />
          ) : (
            <Mic size={18} color="#fff" />
          )}
        </button>

        {/* Send button */}
        {hasContent && (
          <button
            onClick={handleSend}
            disabled={!hasContent || isLoading}
            className="flex items-center justify-center rounded-full flex-shrink-0 animate-scaleIn"
            style={{
              width: '44px', height: '44px',
              border: 'none',
              cursor: hasContent && !isLoading ? 'pointer' : 'default',
              background: 'var(--primary)',
              boxShadow: '0 2px 8px rgba(29,158,117,0.3)',
              opacity: hasContent && !isLoading ? 1 : 0.4,
              transition: 'all 0.2s var(--ease-spring)',
            }}
            aria-label="Send message"
          >
            <Send size={18} color="#fff" />
          </button>
        )}
      </div>

      {/* STT error */}
      {sttError && (
        <p className="text-xs mt-2 px-2" style={{ color: 'var(--danger)' }}>
          {sttError}
        </p>
      )}

      {/* Voice confirmation modal */}
      {showConfirm && (
        <VoiceConfirmModal
          text={transcribed}
          onConfirm={() => {
            setShowConfirm(false);
            onSend(transcribed, true);
            setTranscribed('');
          }}
          onRetry={() => {
            setShowConfirm(false);
            setTranscribed('');
            setTimeout(handleStartListening, 300);
          }}
          onCancel={() => { setShowConfirm(false); setTranscribed(''); }}
        />
      )}
    </>
  );
}

function VoiceConfirmModal({ text, onConfirm, onRetry, onCancel }) {
  return (
    <div
      className="modal-backdrop flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="card animate-scaleIn"
        style={{ maxWidth: '380px', width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-2" style={{ fontSize: '15px' }}>Did you say:</h3>
        <p className="text-sm mb-4 p-3 rounded-lg" style={{
          background: 'var(--primary-muted)',
          color: 'var(--text-primary)',
          lineHeight: 1.5,
        }}>
          "{text}"
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn btn-ghost btn-sm flex-1">Cancel</button>
          <button onClick={onRetry} className="btn btn-secondary btn-sm flex-1">Retry</button>
          <button onClick={onConfirm} className="btn btn-primary btn-sm flex-1">Send</button>
        </div>
      </div>
    </div>
  );
}