import { getLanguageChips } from '../data/languages.js';

const SuggestionChips = ({ language, onSend }) => {
  const chips = getLanguageChips(language);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '16px', padding: '32px 16px',
      animation: 'messageSlideIn 0.5s ease forwards',
    }}>
      {/* Welcome Message */}
      <div style={{
        width: '56px', height: '56px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #0F6E56, #10B981)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', boxShadow: '0 4px 16px rgba(15, 110, 86, 0.3)',
        animation: 'pulse 2s ease-in-out infinite',
      }}>🔊</div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
          नमस्ते! 🙏
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>
          बोलिए या नीचे से चुनें:
        </p>
      </div>

      <div 
        role="list" 
        aria-label="सुझाव"
        style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}
      >
        {chips.map((chip, index) => (
          <button
            key={index}
            onClick={() => onSend(chip)}
            role="listitem"
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '980px',
              cursor: 'pointer',
              border: '1px solid #E5E7EB',
              background: 'white',
              color: '#0F6E56',
              transition: 'all 0.2s ease',
              minHeight: '48px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              animationDelay: `${index * 0.1}s`,
              animation: 'messageSlideIn 0.4s ease forwards',
              opacity: 0,
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = '#0F6E56';
              e.currentTarget.style.background = '#F0FDF4';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 110, 86, 0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes messageSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default SuggestionChips;