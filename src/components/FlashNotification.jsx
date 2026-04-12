import { useEffect, useState } from 'react';

/**
 * FlashNotification - Visual flash when new AI message arrives
 * Used to alert users when app is in background or screen is off
 */
function FlashNotification({ trigger }) {
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (trigger && trigger > 0) {
      setIsFlashing(true);
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 300); // 100ms flash + 200ms fade out
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!isFlashing) return null;

  return (
    <>
      <style>
        {`
          @keyframes vaaniFlash {
            0% { opacity: 0.4; }
            20% { opacity: 0.4; }
            100% { opacity: 0; }
          }
          .vaani-flash-overlay {
            animation: vaaniFlash 300ms ease-out forwards;
          }
        `}
      </style>
      <div
        className="vaani-flash-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'white',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
        aria-hidden="true"
      />
    </>
  );
}

export default FlashNotification;