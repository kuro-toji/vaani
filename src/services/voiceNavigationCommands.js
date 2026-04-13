// Voice command patterns for hands-free navigation
export const voiceCommands = {
  // Navigation commands
  'go to chat': { action: 'navigate', target: '#main-content', description: 'Go to chat' },
  'start chat': { action: 'navigate', target: '#main-content', description: 'Start chatting' },
  'chat पर जाओ': { action: 'navigate', target: '#main-content', description: 'Go to chat' },
  
  // Language selection
  'select hindi': { action: 'language', code: 'hi', description: 'Select Hindi' },
  'select tamil': { action: 'language', code: 'ta', description: 'Select Tamil' },
  'select telugu': { action: 'language', code: 'te', description: 'Select Telugu' },
  'select bengali': { action: 'language', code: 'bn', description: 'Select Bengali' },
  'select marathi': { action: 'language', code: 'mr', description: 'Select Marathi' },
  'hindi चुनो': { action: 'language', code: 'hi', description: 'Select Hindi' },
  
  // Scroll commands
  'scroll down': { action: 'scroll', direction: 'down', description: 'Scroll down' },
  'scroll up': { action: 'scroll', direction: 'up', description: 'Scroll up' },
  'नीचे scroll करो': { action: 'scroll', direction: 'down', description: 'Scroll down' },
  
  // Modal/overlay commands
  'close': { action: 'close', description: 'Close modal' },
  'back': { action: 'close', description: 'Go back' },
  'बंद करो': { action: 'close', description: 'Close' },
  'cancel': { action: 'close', description: 'Cancel' },
  
  // Start voice input
  'start listening': { action: 'voice', description: 'Start voice input' },
  'बोलो': { action: 'voice', description: 'Start speaking' },
  
  // Help
  'help': { action: 'help', description: 'Show voice commands' },
  'मदद': { action: 'help', description: 'Show help' },
};

export function matchCommand(transcript) {
  const lower = transcript.toLowerCase().trim();
  
  for (const [pattern, command] of Object.entries(voiceCommands)) {
    if (lower.includes(pattern) || lower.includes(pattern.replace(/\s+/g, ''))) {
      return command;
    }
  }
  
  return null;
}

export function executeCommand(command) {
  switch (command.action) {
    case 'navigate':
      document.querySelector(command.target)?.focus();
      break;
    case 'language':
      window.dispatchEvent(new CustomEvent('vaani-select-language', { detail: command.code }));
      break;
    case 'scroll':
      if (command.direction === 'down') {
        window.scrollBy({ top: 300, behavior: 'smooth' });
      } else {
        window.scrollBy({ top: -300, behavior: 'smooth' });
      }
      break;
    case 'close':
      window.dispatchEvent(new CustomEvent('vaani-close-modal'));
      break;
    case 'voice':
      window.dispatchEvent(new CustomEvent('vaani-start-voice'));
      break;
    case 'help':
      window.dispatchEvent(new CustomEvent('vaani-show-help'));
      break;
  }
}
