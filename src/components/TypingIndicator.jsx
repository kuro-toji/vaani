const TypingIndicator = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      animation: 'messageSlideIn 0.3s ease forwards',
    }}>
      {/* AI Avatar */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #0F6E56, #10B981)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', color: 'white', flexShrink: 0,
        marginRight: '8px', marginTop: '4px',
        boxShadow: '0 2px 8px rgba(15, 110, 86, 0.3)',
      }}>🔊</div>

      <div 
        aria-live="polite" 
        aria-label="Vaani सोच रहा है"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '14px 20px',
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '20px 20px 20px 4px',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
        }}
      >
        {[0, 1, 2].map(i => (
          <div 
            key={i}
            style={{
              width: '8px', height: '8px',
              backgroundColor: '#0F6E56',
              borderRadius: '50%',
              opacity: 0.6,
              animation: `typingBounce 1.4s infinite ease-in-out both`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes messageSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;