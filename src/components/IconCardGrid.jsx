/**
 * IconCardGrid — Large visual icon cards for speech-impaired users.
 *
 * Each card has a big emoji + short label. Tapping sends a hidden financial
 * prompt to Vaani without showing the internal prompt text to the user.
 * Large tap zones (80x80px min) with active:scale-95 for tremor feedback.
 */

const ICON_CARDS = [
  {
    id: 'tractor',
    emoji: '🚜',
    label: 'खेती',
    prompt: 'मेरी खेती से जो आमदनी होती है उसे FD में लगाऊं या कहीं और? सबसे सुरक्षित विकल्प बताओ।',
  },
  {
    id: 'hospital',
    emoji: '🏥',
    label: 'आपातकाल',
    prompt: 'इमरजेंसी फंड कितना रखना चाहिए और कहां रखूं? अगर अचानक हॉस्पिटल जाना पड़े तो पैसे कैसे तैयार रखूं?',
  },
  {
    id: 'wedding',
    emoji: '💒',
    label: 'शादी',
    prompt: 'शादी के लिए पैसे बचाना है। कितना समय है 2-3 साल, सबसे अच्छा बचत विकल्प बताओ।',
  },
  {
    id: 'education',
    emoji: '📚',
    label: 'पढ़ाई',
    prompt: 'बच्चे की उच्च शिक्षा के लिए अभी से निवेश शुरू करना है। PPF, सुकन्या, या म्यूचुअल फंड — कौन सा सही रहेगा?',
  },
  {
    id: 'home',
    emoji: '🏠',
    label: 'घर',
    prompt: 'घर खरीदना बेहतर है या किराये पर रहना? होम लोन लूं तो कितनी EMI सही रहेगी?',
  },
  {
    id: 'oldage',
    emoji: '🧓',
    label: 'बुढ़ापा',
    prompt: 'मैं 55+ उम्र का हूं। सीनियर सिटीजन के लिए सबसे अच्छी सरकारी योजनाएं बताओ — SCSS, PPF, पेंशन।',
  },
  {
    id: 'baby',
    emoji: '👶',
    label: 'बच्ची',
    prompt: 'मेरी बेटी के लिए सुकन्या समृद्धि योजना के बारे में बताओ। कितना जमा करूं और कब तक?',
  },
  {
    id: 'moneybag',
    emoji: '💰',
    label: 'निवेश',
    prompt: 'मेरे पास कुछ पैसे हैं जो निवेश करना चाहता हूं। सबसे अच्छे विकल्प क्या हैं? FD, SIP, PPF, गोल्ड?',
  },
];

export default function IconCardGrid({ onSendMessage, isVisible, onClose }) {
  if (!isVisible) return null;

  const handleCardTap = (card) => {
    // Send the hidden prompt — user only sees the emoji/label, not the prompt
    onSendMessage(card.prompt);
    onClose();
  };

  const handleKeyDown = (e, card) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardTap(card);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: '100%',
        background: 'var(--vaani-bg, #fff)',
        borderTop: '1px solid var(--vaani-border, #E2E8F0)',
        padding: '16px',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.1)',
        zIndex: 50,
      }}
      role="dialog"
      aria-label="आइकन कार्ड से चुनें"
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--vaani-text)' }}>
            आइकन से बोलें
          </div>
          <div style={{ fontSize: '13px', color: 'var(--vaani-text-secondary, #64748B)' }}>
            जो बोल नहीं सकते उनके लिए
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="बंद करें"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--vaani-bg-secondary, #F1F5F9)',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--vaani-text)',
          }}
        >
          ✕
        </button>
      </div>

      {/* Grid — 2 columns on mobile for max tap zone, 4 on wider */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '12px',
        maxHeight: '360px',
        overflowY: 'auto',
      }}>
        {ICON_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardTap(card)}
            onKeyDown={(e) => handleKeyDown(e, card)}
            tabIndex={0}
            aria-label={card.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minWidth: '80px',
              minHeight: '80px',
              padding: '16px 8px',
              borderRadius: '16px',
              border: '2px solid var(--vaani-border, #E2E8F0)',
              background: 'var(--vaani-bg-card, #fff)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ fontSize: '36px', lineHeight: 1 }} role="img" aria-hidden="true">
              {card.emoji}
            </span>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--vaani-text, #1E293B)',
              textAlign: 'center',
              lineHeight: 1.2,
            }}>
              {card.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}