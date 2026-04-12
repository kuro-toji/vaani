import { useState, useEffect } from 'react'
import { Volume2, Check, X } from 'lucide-react'
import { useVoice } from '../hooks/useVoice.js'

export default function ConfirmationModal({ text, onConfirm, onRetry, onCancel, language = 'hi' }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const { speak, stopSpeaking } = useVoice()

  const handlePlay = () => {
    if (isPlaying) {
      stopSpeaking()
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      speak(text, language)
      // Stop after speaking
      setTimeout(() => setIsPlaying(false), 5000)
    }
  }

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="confirmation-title"
      style={{
        position: 'fixed',
        bottom: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        padding: '16px',
        maxWidth: '90vw',
        width: '380px',
        zIndex: 100,
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      }}
    >
      <button
        onClick={onCancel}
        aria-label="रद्द करें"
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          minWidth: '56px',
          minHeight: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={16} color="#9CA3AF" />
      </button>
      <p 
        id="confirmation-title"
        style={{
          fontSize: '12px',
          color: '#6B7280',
          marginBottom: '8px',
          textAlign: 'center',
        }}
      >
        क्या आपने यह कहा?
      </p>
      <p style={{
        fontSize: '16px',
        color: '#111827',
        textAlign: 'center',
        direction: 'auto',
        marginBottom: '16px',
        minHeight: '24px',
        fontFamily: /[ऀ-ॿ]/.test(text) ? 'sans-serif' : '-apple-system',
      }}>
        "{text}"
      </p>
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
      }}>
        {/* Play button */}
        <button
          onClick={handlePlay}
          aria-label="संदेश सुनें"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: isPlaying ? '#0F6E56' : '#F3F4F6',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <Volume2 size={20} color={isPlaying ? 'white' : '#6B7280'} />
          <span style={{ fontSize: '8px', color: isPlaying ? 'white' : '#6B7280' }}>Play</span>
        </button>

        {/* Retry button */}
        <button
          onClick={onRetry}
          aria-label="फिर से रिकॉर्ड करें"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <X size={20} color="#DC2626" />
          <span style={{ fontSize: '8px', color: '#DC2626' }}>Retry</span>
        </button>

        {/* Confirm button */}
        <button
          onClick={onConfirm}
          aria-label="संदेश भेजें"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#0F6E56',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <Check size={20} color="white" />
          <span style={{ fontSize: '8px', color: 'white' }}>Send</span>
        </button>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        marginTop: '8px',
      }}>
        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Play</span>
        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Retry</span>
        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Send</span>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '12px',
      }}>
        <button
          onClick={onCancel}
          aria-label="रद्द करें"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#9CA3AF',
            padding: '8px 16px',
            minWidth: '56px',
            minHeight: '44px',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}