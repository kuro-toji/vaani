import { getLanguageChips } from '../data/languages.js';

const SuggestionChips = ({ language, onSend }) => {
  const chips = getLanguageChips(language);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-gray-500">Try asking:</p>
      <div 
        role="list" 
        aria-label="सुझाव"
        className="flex flex-wrap justify-center gap-2"
      >
        {chips.map((chip, index) => (
          <button
            key={index}
            onClick={() => onSend(chip)}
            role="listitem"
            className="px-4 py-3 text-sm font-medium rounded-full cursor-pointer border border-[#1D9E75] text-[#0F6E56] hover:bg-[#E1F5EE] transition-colors vaani-touch-target"
            style={{ minWidth: '56px', minHeight: '56px' }}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionChips;