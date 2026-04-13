/**
 * MessageBubble - Renders a single chat message bubble
 * @param {Object} props
 * @param {Object} props.message - Message object with { id, role, content, timestamp }
 * @param {string} props.language - Language code for potential i18n
 */
import useVibration from '../hooks/useVibration.js';

function MessageBubble({ message, language }) {
  const isUser = message.role === 'user';
  const { vibrateOnTap } = useVibration();
  
  // Format timestamp to HH:MM
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Parse content: handle **bold** and newlines
  const parseContent = (content) => {
    if (!content) return [];
    
    // Split by newlines to create paragraphs
    const paragraphs = content.split('\n');
    
    return paragraphs.map((paragraph, pIndex) => {
      // Replace **text** with <strong>text</strong> using regex
      const parts = paragraph.split(/(\*\*.*?\*\*)/g);
      
      return (
        <span key={pIndex}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
          {pIndex < paragraphs.length - 1 && <br />}
        </span>
      );
    });
  };

  const bubbleClasses = isUser
    ? 'bg-[#1D9E75] text-white rounded-[18px_18px_4px_18px]'
    : 'bg-white border border-[#E5E7EB] text-[#111827] rounded-[18px_18px_18px_4px]';

  return (
    <div className={`flex overscroll-contain ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        dir="auto" 
        role="region"
        aria-label={isUser ? 'आपका संदेश' : 'Vaani का जवाब'}
        className={`${isUser ? 'max-w-[75%]' : 'max-w-[85%]'} ${bubbleClasses} px-4 py-3`}
        onClick={() => vibrateOnTap()}
      >
        <p className="whitespace-pre-wrap">
          {parseContent(message.content)}
        </p>
        <span 
          className="text-[11px] text-[#9CA3AF] mt-1 block"
          aria-label={formatTime(message.timestamp)}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

export default MessageBubble;