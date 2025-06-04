import React from 'react';

interface AriaLiveRegionProps {
  announcement: string;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
}

const AriaLiveRegion: React.FC<AriaLiveRegionProps> = ({
  announcement,
  politeness = 'polite',
  atomic = true
}) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  );
};

export default AriaLiveRegion; 