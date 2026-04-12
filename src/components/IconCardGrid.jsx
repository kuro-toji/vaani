import { iconCards } from '../data/iconCards.js';

export default function IconCardGrid({ onSendMessage, isVisible, onClose }) {
  if (!isVisible) return null;

  const handleCardTap = (card) => {
    // Add selected animation class
    const cardEl = document.getElementById(`icon-card-${card.id}`);
    if (cardEl) {
      cardEl.classList.add('selected');
      setTimeout(() => {
        cardEl.classList.remove('selected');
        onSendMessage(card.prompt);
        onClose();
      }, 500);
    } else {
      onSendMessage(card.prompt);
      onClose();
    }
  };

  const handleKeyDown = (e, card) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardTap(card);
    }
  };

  return (
    <div 
      className="absolute inset-x-0 bottom-full bg-[var(--vaani-bg)] border-t border-[var(--vaani-border)] p-4 shadow-lg z-50"
      role="dialog"
      aria-label="आइकन कार्ड से चुनें"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[var(--vaani-text)]">आइकन से बोलें</span>
          <span className="text-xs text-[var(--vaani-text-secondary)]">जो बोल नहीं सकते उनके लिए</span>
        </div>
        <button
          onClick={onClose}
          aria-label="बंद करें"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--vaani-border)] transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Grid */}
      <div 
        className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto"
        role="listbox"
        aria-label="वित्तीय विषय चुनें"
      >
        {iconCards.map((card) => (
          <div
            key={card.id}
            id={`icon-card-${card.id}`}
            role="option"
            tabIndex={0}
            aria-label={`${card.label} - ${card.labelHindi}`}
            className={`icon-card category-${card.category}`}
            onClick={() => handleCardTap(card)}
            onKeyDown={(e) => handleKeyDown(e, card)}
          >
            <span className="text-3xl" role="img" aria-hidden="true">{card.emoji}</span>
            <span className="text-sm font-medium text-[var(--vaani-text)]">{card.label}</span>
            <span className="text-xs text-[var(--vaani-text-secondary)]">{card.labelHindi}</span>
          </div>
        ))}
      </div>

      {/* Category Legend */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--vaani-border)]">
        <span className="text-xs text-[var(--vaani-text-secondary)]">श्रेणी:</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#10B98120] text-[#10B981] border border-[#10B981]">💰 निवेश</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#3B82F620] text-[#3B82F6] border border-[#3B82F6]">🏥 बीमा</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#F59E0B20] text-[#F59E0B] border border-[#F59E0B]">🏦 बचत</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#8B5CF620] text-[#8B5CF6] border border-[#8B5CF6]">🏛️ सरकारी</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#EF444420] text-[#EF4444] border border-[#EF4444]">📋 टैक्स</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#14B8A620] text-[#14B8A6] border border-[#14B8A6]">💒 जीवन</span>
      </div>
    </div>
  );
}