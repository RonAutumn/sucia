import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library';
import { parseQRData, GuestQRData, ScanResult } from '../utils/qrCodeUtils';

interface CameraScannerProps {
  onScanSuccess: (data: GuestQRData) => void;
  onScanError: (error: string) => void;
  eventId: string;
  isActive: boolean;
  className?: string;
}

interface ScannerState {
  isScanning: boolean;
  hasCamera: boolean;
  cameraError: string | null;
  lastScanTime: number;
  scanCount: number;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanSuccess,
  onScanError,
  eventId,
  isActive,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [scannerState, setScannerState] = useState<ScannerState>({
    isScanning: false,
    hasCamera: false,
    cameraError: null,
    lastScanTime: 0,
    scanCount: 0
  });

  // Initialize scanner
  useEffect(() => {
    if (!codeReaderRef.current) {
      codeReaderRef.current = new BrowserMultiFormatReader();
    }
    
    return () => {
      stopScanning();
    };
  }, []);

  // Handle active state changes
  useEffect(() => {
    if (isActive) {
      startScanning();
    } else {
      stopScanning();
    }
  }, [isActive]);

  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    
    setScannerState(prev => ({
      ...prev,
      isScanning: false,
      hasCamera: false,
      cameraError: null
    }));
  }, []);

  const startScanning = useCallback(async () => {
    if (!codeReaderRef.current || !videoRef.current) return;

    try {
      setScannerState(prev => ({ ...prev, isScanning: true, cameraError: null }));

      // Check for camera availability
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Prefer back camera for QR scanning
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setScannerState(prev => ({ ...prev, hasCamera: true }));

      // Start continuous scanning
      scanIntervalRef.current = setInterval(() => {
        scanFrame();
      }, 250); // Scan every 250ms for good performance

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Camera access failed';
      setScannerState(prev => ({
        ...prev,
        isScanning: false,
        hasCamera: false,
        cameraError: errorMessage
      }));
      onScanError(`Camera error: ${errorMessage}`);
    }
  }, [onScanError]);

  const scanFrame = useCallback(async () => {
    if (!codeReaderRef.current || !videoRef.current || !streamRef.current) return;

    try {
      const result = await codeReaderRef.current.decodeFromVideoElement(videoRef.current);
      
      if (result) {
        const now = Date.now();
        
        // Debounce scanning to prevent duplicate reads
        if (now - scannerState.lastScanTime < 2000) {
          return;
        }

        const scanResult: ScanResult = parseQRData(result.getText());
        
        setScannerState(prev => ({
          ...prev,
          lastScanTime: now,
          scanCount: prev.scanCount + 1
        }));

        if (scanResult.success && scanResult.data) {
          // Validate event ID matches
          if (scanResult.data.eventId !== eventId) {
            onScanError(`QR code is for event "${scanResult.data.eventId}", but current event is "${eventId}"`);
            return;
          }
          
          onScanSuccess(scanResult.data);
        } else {
          onScanError(scanResult.error || 'Invalid QR code format');
        }
      }
    } catch (error) {
      // Ignore common scanning exceptions that just mean no code was found
      if (
        error instanceof NotFoundException ||
        error instanceof ChecksumException ||
        error instanceof FormatException
      ) {
        // These are expected when no QR code is visible
        return;
      }
      
      console.warn('QR scanning error:', error);
    }
  }, [eventId, onScanSuccess, onScanError, scannerState.lastScanTime]);

  const handleVideoError = (error: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const errorMessage = 'Video stream error';
    setScannerState(prev => ({
      ...prev,
      cameraError: errorMessage
    }));
    onScanError(errorMessage);
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Video element for camera stream */}
      <video
        ref={videoRef}
        className="w-full h-64 bg-black rounded-lg object-cover"
        playsInline
        muted
        onError={handleVideoError}
        aria-label="QR code scanner camera view"
      />
      
      {/* Scanning overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scanning reticle */}
        <div className="absolute inset-4 border-2 border-blue-500 rounded-lg">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
        </div>
        
        {/* Status overlay */}
        <div className="absolute top-2 left-2 right-2 bg-black bg-opacity-75 text-white text-sm rounded px-3 py-2">
          <div className="flex items-center justify-between">
            <span>
              {scannerState.isScanning ? (
                scannerState.hasCamera ? (
                  <>
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Scanning for QR codes...
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                    Initializing camera...
                  </>
                )
              ) : (
                <>
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Scanner stopped
                </>
              )}
            </span>
            <span className="text-xs">
              Scans: {scannerState.scanCount}
            </span>
          </div>
        </div>
        
        {/* Error overlay */}
        {scannerState.cameraError && (
          <div className="absolute bottom-2 left-2 right-2 bg-red-600 text-white text-sm rounded px-3 py-2">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {scannerState.cameraError}
            </div>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Point your camera at a QR code to check in guests</p>
        <p className="text-xs mt-1">Make sure the QR code is well lit and clearly visible</p>
      </div>
    </div>
  );
};

export default CameraScanner; 