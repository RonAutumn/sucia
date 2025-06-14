import Papa from 'papaparse';
import { CSVGuest, CSVValidationError, CSVImportResult, Guest } from '../types';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Column mapping for ForbiddenTickets export format
const COLUMN_MAPPINGS = {
  firstName: ['first name', 'firstname', 'first_name', 'given name'],
  lastName: ['last name', 'lastname', 'last_name', 'surname', 'family name'],
  email: ['email', 'email address', 'e-mail'],
  ticketType: ['ticket type', 'tickettype', 'ticket_type', 'type'],
  orderId: ['order id', 'orderid', 'order_id', 'order number', 'ordernumber']
};

/**
 * Normalize column headers for mapping
 */
function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[_-]/g, ' ');
}

/**
 * Map CSV headers to our internal field names
 */
function mapHeaders(headers: string[]): Record<string, number> {
  const headerMap: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    const normalizedHeader = normalizeHeader(header);
    
    // Check each field mapping
    Object.entries(COLUMN_MAPPINGS).forEach(([field, variations]) => {
      if (variations.includes(normalizedHeader)) {
        headerMap[field] = index;
      }
    });
  });
  
  return headerMap;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate a single CSV row
 */
function validateCSVRow(row: string[], headerMap: Record<string, number>, rowIndex: number): {
  guest?: CSVGuest;
  errors: CSVValidationError[];
} {
  const errors: CSVValidationError[] = [];
  
  // Extract fields based on header mapping
  const firstName = headerMap.firstName !== undefined ? row[headerMap.firstName]?.trim() : '';
  const lastName = headerMap.lastName !== undefined ? row[headerMap.lastName]?.trim() : '';
  const email = headerMap.email !== undefined ? row[headerMap.email]?.trim() : '';
  const ticketType = headerMap.ticketType !== undefined ? row[headerMap.ticketType]?.trim() : undefined;
  const orderId = headerMap.orderId !== undefined ? row[headerMap.orderId]?.trim() : undefined;
  
  // Validate required fields
  if (!firstName) {
    errors.push({
      row: rowIndex,
      field: 'firstName',
      value: firstName,
      message: 'First name is required'
    });
  }
  
  if (!lastName) {
    errors.push({
      row: rowIndex,
      field: 'lastName',
      value: lastName,
      message: 'Last name is required'
    });
  }
  
  if (!email) {
    errors.push({
      row: rowIndex,
      field: 'email',
      value: email,
      message: 'Email is required'
    });
  } else if (!isValidEmail(email)) {
    errors.push({
      row: rowIndex,
      field: 'email',
      value: email,
      message: 'Invalid email format'
    });
  }
  
  // If no errors, create guest object
  if (errors.length === 0) {
    return {
      guest: {
        firstName,
        lastName,
        email: email.toLowerCase(), // Normalize email for comparison
        ticketType,
        orderId
      },
      errors
    };
  }
  
  return { errors };
}

/**
 * Find duplicate guests based on email
 */
function findDuplicates(guests: CSVGuest[], existingGuests: Guest[]): {
  unique: CSVGuest[];
  duplicates: CSVGuest[];
} {
  const existingEmails = new Set(existingGuests.map(g => g.email.toLowerCase()));
  const csvEmails = new Set<string>();
  const unique: CSVGuest[] = [];
  const duplicates: CSVGuest[] = [];
  
  guests.forEach(guest => {
    const email = guest.email.toLowerCase();
    
    // Check against existing guests
    if (existingEmails.has(email)) {
      duplicates.push(guest);
      return;
    }
    
    // Check for duplicates within CSV
    if (csvEmails.has(email)) {
      duplicates.push(guest);
      return;
    }
    
    csvEmails.add(email);
    unique.push(guest);
  });
  
  return { unique, duplicates };
}

/**
 * Parse and validate CSV file
 */
export async function parseCSVFile(file: File, existingGuests: Guest[] = []): Promise<CSVImportResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing failed: ${results.errors[0].message}`));
            return;
          }
          
          const data = results.data as string[][];
          
          if (data.length < 2) {
            reject(new Error('CSV file must contain at least a header row and one data row'));
            return;
          }
          
          const headers = data[0];
          const headerMap = mapHeaders(headers);
          
          // Check if we have the required columns
          if (headerMap.firstName === undefined || headerMap.lastName === undefined || headerMap.email === undefined) {
            reject(new Error(
              'CSV file must contain First Name, Last Name, and Email columns. ' +
              'Supported variations: First Name/FirstName/first_name, Last Name/LastName/last_name, Email/email address'
            ));
            return;
          }
          
          const validGuests: CSVGuest[] = [];
          const allErrors: CSVValidationError[] = [];
          
          // Process data rows (skip header)
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const { guest, errors } = validateCSVRow(row, headerMap, i + 1);
            
            if (guest) {
              validGuests.push(guest);
            }
            
            allErrors.push(...errors);
          }
          
          // Find duplicates
          const { unique, duplicates } = findDuplicates(validGuests, existingGuests);
          
          resolve({
            valid: unique,
            duplicates,
            invalid: allErrors,
            totalRows: data.length - 1 // Exclude header
          });
          
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
}

/**
 * Convert CSVGuest to Guest format
 */
export function csvGuestToGuest(csvGuest: CSVGuest): Guest {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: `${csvGuest.firstName} ${csvGuest.lastName}`,
    email: csvGuest.email,
    checkedIn: false
  };
}

/**
 * Validate file before processing
 */
export function validateFile(file: File): string | null {
  // Check file type
  if (!file.type.includes('csv') && !file.name.toLowerCase().endsWith('.csv')) {
    return 'Please select a CSV file';
  }
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return 'File size must be less than 5MB';
  }
  
  return null;
}

/**
 * Escape CSV field if it contains special characters
 */
function escapeCSVField(field: string): string {
  // If field contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Export guest list to CSV format
 */
export function exportGuestsToCSV(guests: Guest[], eventId: string): void {
  // Create CSV headers
  const headers = ['Name', 'Email', 'Check-in Status'];
  
  // Convert guests to CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...guests.map(guest => [
      escapeCSVField(guest.name),
      escapeCSVField(guest.email),
      escapeCSVField(guest.checkedIn ? 'Checked In' : 'Not Checked In')
    ].join(','))
  ];
  
  // Join all rows with newlines
  const csvContent = csvRows.join('\n');
  
  // Create blob with UTF-8 encoding
  const blob = new Blob(['\uFEFF' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Generate filename with current timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `event-${eventId}-guests-${timestamp}.csv`;
  
  // Configure download
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up object URL
  URL.revokeObjectURL(url);
} 