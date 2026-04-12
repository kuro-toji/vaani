import { useEffect } from 'react';
import { Mic } from 'lucide-react';
import { useVoice } from '../hooks/useVoice.js';
import useVibration from '../hooks/useVibration.js';

export default function FullScreenPTT({ language, onSend, onClose }) {
  const { isListening, startListening, stopListening, isModelLoading } = useVoice();
  const { vibrateOnRecordingStart } = useVibration();

  // Prevent scrolling when full screen PTT is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleInteraction = (e) => {
    e.preventDefault();
    if (isModelLoading) return;

    if (isListening) {
      stopListening();
    } else {
      vibrateOnRecordingStart();
      startListening(
        (transcript, isFinal) => {
          if (isFinal && transcript.trim()) {
            onSend(transcript, true);
            // In full-screen mode, we might want to automatically close or just flash a success
          }
        },
        (error) => console.error('Speech recognition error:', error),
        language
      );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[#0F6E56] flex flex-col items-center justify-center cursor-pointer touch-none select-none"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      role="button"
      aria-pressed={isListening}
      aria-label={isListening ? "रिकॉर्डिंग बंद करने के लिए कहीं भी टच करें" : "बोलने के लिए कहीं भी टच करें"}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 p-4 bg-white/20 rounded-full text-white hover:bg-white/30 backdrop-blur-sm z-10"
        aria-label="पूरा स्क्रीन मोड बंद करें"
      >
        ✕
      </button>

      <div className="text-center flex flex-col items-center justify-center p-8">
        <div 
          className={`w-40 h-40 rounded-full flex items-center justify-center mb-12 transition-all duration-300 ${
            isListening 
              ? 'bg-white text-[#0F6E56] scale-110 shadow-[0_0_60px_rgba(255,255,255,0.6)]' 
              : 'bg-white/20 text-white border-4 border-white/40'
          }`}
        >
          <Mic size={80} color={isListening ? '#0F6E56' : 'white'} />
        </div>
        
        <h2 className="text-white text-4xl md:text-5xl font-bold mb-6 text-center leading-tight">
          {isModelLoading ? 'रुकिए...' : isListening ? 'बोलिए, मैं सुन रही हूँ...' : 'बोलने के लिए स्क्रीन पर कहीं भी टच करें'}
        </h2>
        
        <p className="text-white/80 text-xl font-medium tracking-wide">
          Vaani Full-Screen Mode
        </p>
      </div>
    </div>
  );
}
