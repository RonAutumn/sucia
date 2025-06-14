import React, { useEffect, useRef } from 'react';
import { generateGuestQRData } from '../utils/qrCodeUtils';

interface QRCodeDisplayProps {
  eventId: string;
  guestId: string;
  guestName: string;
  size?: number;
  className?: string;
}

/**
 * Simple QR Code display component using HTML5 Canvas
 * For production, consider using a dedicated QR code library like 'qrcode'
 */
export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  eventId,
  guestId,
  guestName,
  size = 200,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrData = generateGuestQRData(eventId, guestId, guestName);

  useEffect(() => {
    if (canvasRef.current) {
      generateQRCodeCanvas(canvasRef.current, qrData, size);
    }
  }, [qrData, size]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="border border-gray-300 rounded-lg"
        aria-label={`QR code for ${guestName}`}
      />
      <div className="mt-2 text-center">
        <p className="text-sm font-medium text-gray-900">{guestName}</p>
        <p className="text-xs text-gray-500">Guest ID: {guestId}</p>
      </div>
    </div>
  );
};

/**
 * Simple QR code generator for demonstration purposes
 * In production, use a proper QR code library like 'qrcode'
 */
function generateQRCodeCanvas(canvas: HTMLCanvasElement, data: string, size: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);

  // For this POC, we'll create a simple pattern representing the QR data
  // In a real implementation, use a proper QR code generation library
  const gridSize = 21; // Standard QR code is 21x21 modules
  const moduleSize = (size - 40) / gridSize; // Leave border
  const offsetX = 20;
  const offsetY = 20;

  // Generate a simple hash-based pattern from the data
  const hash = simpleHash(data);
  
  ctx.fillStyle = 'black';
  
  // Draw finder patterns (corners)
  drawFinderPattern(ctx, offsetX, offsetY, moduleSize);
  drawFinderPattern(ctx, offsetX + (gridSize - 7) * moduleSize, offsetY, moduleSize);
  drawFinderPattern(ctx, offsetX, offsetY + (gridSize - 7) * moduleSize, moduleSize);
  
  // Draw data pattern based on hash
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // Skip finder pattern areas
      if (isFinderPattern(x, y, gridSize)) continue;
      
      // Simple hash-based pattern
      const shouldFill = (hash + x * 7 + y * 11) % 3 === 0;
      
      if (shouldFill) {
        ctx.fillRect(
          offsetX + x * moduleSize,
          offsetY + y * moduleSize,
          moduleSize,
          moduleSize
        );
      }
    }
  }
  
  // Add text below for demo purposes
  ctx.fillStyle = 'black';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Demo QR Code', size / 2, size - 5);
}

function drawFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number) {
  // Outer black square
  ctx.fillRect(x, y, moduleSize * 7, moduleSize * 7);
  
  // Inner white square
  ctx.fillStyle = 'white';
  ctx.fillRect(x + moduleSize, y + moduleSize, moduleSize * 5, moduleSize * 5);
  
  // Center black square
  ctx.fillStyle = 'black';
  ctx.fillRect(x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, moduleSize * 3);
}

function isFinderPattern(x: number, y: number, gridSize: number): boolean {
  // Top-left finder pattern
  if (x < 9 && y < 9) return true;
  
  // Top-right finder pattern
  if (x >= gridSize - 8 && y < 9) return true;
  
  // Bottom-left finder pattern
  if (x < 9 && y >= gridSize - 8) return true;
  
  return false;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export default QRCodeDisplay; 