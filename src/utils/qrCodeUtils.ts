export interface GuestQRData {
  eventId: string;
  guestId: string;
  guestName: string;
  timestamp: number;
  version: '1.0';
}

export interface ScanResult {
  success: boolean;
  data?: GuestQRData;
  error?: string;
  rawData?: string;
}

/**
 * Generate QR code data for a guest
 */
export function generateGuestQRData(
  eventId: string, 
  guestId: string, 
  guestName: string
): string {
  const qrData: GuestQRData = {
    eventId,
    guestId,
    guestName,
    timestamp: Date.now(),
    version: '1.0'
  };
  
  return JSON.stringify(qrData);
}

/**
 * Parse QR code data and validate structure
 */
export function parseQRData(rawData: string): ScanResult {
  try {
    const data = JSON.parse(rawData) as GuestQRData;
    
    // Validate required fields
    if (!data.eventId || !data.guestId || !data.guestName) {
      return {
        success: false,
        error: 'Invalid QR code: Missing required fields',
        rawData
      };
    }
    
    // Validate version compatibility
    if (data.version !== '1.0') {
      return {
        success: false,
        error: `Unsupported QR code version: ${data.version}`,
        rawData
      };
    }
    
    return {
      success: true,
      data,
      rawData
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid QR code format',
      rawData
    };
  }
}

/**
 * Generate sample QR codes for testing
 */
export function generateSampleQRCodes(eventId: string, guests: { id: string; name: string }[]): Array<{ guestId: string; qrData: string }> {
  return guests.map(guest => ({
    guestId: guest.id,
    qrData: generateGuestQRData(eventId, guest.id, guest.name)
  }));
} 