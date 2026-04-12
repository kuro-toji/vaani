import { useState, useRef } from 'react';
import { fileToBase64, extractPassbookData, isMiniMaxConfigured } from '../services/ocrService.js';

/**
 * PassbookScanner — Camera/file upload component for bank passbook OCR.
 * Uses MiniMax Vision API to extract financial data from photos.
 */
export default function PassbookScanner({ onExtracted, onClose }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('कृपया एक छवि फ़ाइल चुनें (JPG, PNG)');
      return;
    }

    // Show preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    setError(null);
    setIsProcessing(true);

    try {
      const base64 = await fileToBase64(file);
      const data = await extractPassbookData(base64, file.type);

      if (data.error) {
        setError(data.error);
      } else {
        onExtracted(data);
      }
    } catch (err) {
      setError(err.message || 'पासबुक पढ़ने में समस्या हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsProcessing(false);
    }
  };

  const configured = isMiniMaxConfigured();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
            📷 पासबुक स्कैन करें
          </h2>
          <button
            onClick={onClose}
            style={{
              background: '#F3F4F6',
              border: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="बंद करें"
          >✕</button>
        </div>

        {!configured && (
          <div style={{
            background: '#FEF3C7',
            border: '1px solid #F59E0B',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#92400E',
          }}>
            ⚠️ MiniMax API key not set. Add VITE_MINIMAX_API_KEY to .env
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden' }}>
            <img
              src={preview}
              alt="Passbook preview"
              style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Upload Area */}
        {!isProcessing && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #D1D5DB',
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
              marginBottom: '16px',
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#0F6E56'}
            onMouseOut={e => e.currentTarget.style.borderColor = '#D1D5DB'}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📸</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>
              पासबुक की फोटो खींचें
            </p>
            <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0 }}>
              या गैलरी से चुनें
            </p>
          </div>
        )}

        {/* Processing */}
        {isProcessing && (
          <div style={{
            textAlign: 'center',
            padding: '32px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #E5E7EB',
              borderTopColor: '#0F6E56',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ fontSize: '16px', color: '#374151', fontWeight: 600 }}>
              पासबुक पढ़ रहे हैं...
            </p>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
              MiniMax AI से विश्लेषण हो रहा है
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #EF4444',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '14px',
            color: '#991B1B',
            marginTop: '12px',
          }}>
            ❌ {error}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          aria-label="पासबुक फोटो अपलोड करें"
        />

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
