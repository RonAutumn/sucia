import { useState, useCallback } from 'react';

interface AriaLiveHook {
  announcement: string;
  announce: (message: string) => void;
  clearAnnouncement: () => void;
}

export const useAriaLiveAnnouncements = (): AriaLiveHook => {
  const [announcement, setAnnouncement] = useState<string>('');

  const announce = useCallback((message: string) => {
    // Clear any existing announcement first to ensure screen readers pick up the new one
    setAnnouncement('');
    
    // Use a small delay to ensure the clear happens before the new announcement
    setTimeout(() => {
      setAnnouncement(message);
    }, 100);
  }, []);

  const clearAnnouncement = useCallback(() => {
    setAnnouncement('');
  }, []);

  return {
    announcement,
    announce,
    clearAnnouncement
  };
}; 