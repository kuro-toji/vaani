const TypingIndicator = () => {
  return (
    <>
      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1);
            }
          }
        `}
      </style>
      <div 
        aria-live="polite" 
        aria-label="Vaani टाइप कर रहा है"
        className="inline-flex items-center px-4 py-3 bg-white border border-[#E5E7EB] rounded-[18px_18px_18px_4px]"
      >
        {[0, 1, 2].map(i => (
          <div 
            key={i}
            className="w-2 h-2 bg-[#9CA3AF] rounded-full"
            style={{ animation: `bounce 1.4s infinite ease-in-out both`, animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </>
  );
};

export default TypingIndicator;