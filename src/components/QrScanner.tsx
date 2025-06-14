import React, { useState, useRef, useEffect } from 'react';

interface QrScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({ onScan, onClose }) => {
  const [hasCamera, setHasCamera] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Camera access denied:', error);
        setHasCamera(false);
        setIsLoading(false);
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleManualInput = (input: string) => {
    if (input.trim()) {
      onScan(input.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Starting camera...</p>
        </div>
      </div>
    );
  }

  if (!hasCamera) {
    return (
      <div className="p-4 text-center">
        <p className="mb-4 text-red-600">Camera access not available</p>
        <p className="mb-4 text-sm text-gray-600">Please enter the card ID manually:</p>
        <input
          type="text"
          placeholder="Enter card ID"
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleManualInput((e.target as HTMLInputElement).value);
            }
          }}
        />
        <button
          onClick={() => {
            const input = document.querySelector('input') as HTMLInputElement;
            handleManualInput(input.value);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-64 object-cover rounded"
      />
      
      {/* Camera overlay */}
      <div className="absolute inset-0 border-2 border-blue-500 rounded">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-white border-dashed"></div>
      </div>
      
      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 mb-2">
          Position the QR code within the frame
        </p>
        <p className="text-xs text-gray-500">
          Or enter card ID manually below:
        </p>
        <input
          type="text"
          placeholder="Enter card ID manually"
          className="w-full mt-2 border border-gray-300 rounded px-3 py-2 text-sm"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleManualInput((e.target as HTMLInputElement).value);
            }
          }}
        />
      </div>
    </div>
  );
}; 