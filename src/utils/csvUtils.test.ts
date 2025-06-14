import { parseCSVFile, validateFile, csvGuestToGuest, exportGuestsToCSV } from './csvUtils';
import { Guest, CSVGuest } from '../types';

// Mock Papa Parse
jest.mock('papaparse', () => ({
  parse: jest.fn()
}));

import Papa from 'papaparse';
const mockedPapa = Papa as jest.Mocked<typeof Papa>;

describe('csvUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFile', () => {
    it('accepts valid CSV files', () => {
      const file = new File(['data'], 'test.csv', { type: 'text/csv' });
      expect(validateFile(file)).toBeNull();
    });

    it('accepts CSV files without explicit MIME type but with .csv extension', () => {
      const file = new File(['data'], 'test.csv', { type: '' });
      expect(validateFile(file)).toBeNull();
    });

    it('rejects non-CSV files', () => {
      const file = new File(['data'], 'test.txt', { type: 'text/plain' });
      expect(validateFile(file)).toBe('Please select a CSV file');
    });

    it('rejects files larger than 5MB', () => {
      const largeData = 'x'.repeat(6 * 1024 * 1024); // 6MB
      const file = new File([largeData], 'test.csv', { type: 'text/csv' });
      expect(validateFile(file)).toBe('File size must be less than 5MB');
    });

    it('accepts files exactly at 5MB limit', () => {
      const largeData = 'x'.repeat(5 * 1024 * 1024); // Exactly 5MB
      const file = new File([largeData], 'test.csv', { type: 'text/csv' });
      expect(validateFile(file)).toBeNull();
    });
  });

  describe('csvGuestToGuest', () => {
    it('converts CSVGuest to Guest format', () => {
      const csvGuest: CSVGuest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        ticketType: 'VIP',
        orderId: '12345'
      };

      const result = csvGuestToGuest(csvGuest);

      expect(result).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        checkedIn: false
      });
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
    });

    it('handles CSVGuest without optional fields', () => {
      const csvGuest: CSVGuest = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com'
      };

      const result = csvGuestToGuest(csvGuest);

      expect(result).toMatchObject({
        name: 'Jane Smith',
        email: 'jane@example.com',
        checkedIn: false
      });
    });

    it('generates unique IDs for each guest', () => {
      const csvGuest: CSVGuest = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      };

      const result1 = csvGuestToGuest(csvGuest);
      const result2 = csvGuestToGuest(csvGuest);

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('parseCSVFile', () => {
    const createMockFile = (data: string) => new File([data], 'test.csv', { type: 'text/csv' });

    it('successfully parses valid CSV data', async () => {
      const mockData = [
        ['First Name', 'Last Name', 'Email'],
        ['John', 'Doe', 'john@example.com'],
        ['Jane', 'Smith', 'jane@example.com']
      ];

      mockedPapa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          if (options.complete) {
            options.complete({
              data: mockData,
              errors: [],
              meta: { fields: [] }
            });
          }
        }, 0);
        return {} as any;
      });

      const file = createMockFile('test data');
      const result = await parseCSVFile(file, []);

      expect(result).toEqual({
        valid: [
          { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
        ],
        duplicates: [],
        invalid: [],
        totalRows: 2
      });
    });

    it('handles different column name variations', async () => {
      const mockData = [
        ['first_name', 'last_name', 'email address'],
        ['John', 'Doe', 'john@example.com']
      ];

      mockedPapa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          if (options.complete) {
            options.complete({
              data: mockData,
              errors: [],
              meta: { fields: [] }
            });
          }
        }, 0);
        return {} as any;
      });

      const file = createMockFile('test data');
      const result = await parseCSVFile(file, []);

      expect(result.valid).toEqual([
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
      ]);
    });

    it('detects duplicates against existing guests', async () => {
      const mockData = [
        ['First Name', 'Last Name', 'Email'],
        ['John', 'Doe', 'john@example.com'], // Duplicate
        ['Jane', 'Smith', 'jane@example.com'] // New
      ];

      const existingGuests: Guest[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', checkedIn: false }
      ];

      mockedPapa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          if (options.complete) {
            options.complete({
              data: mockData,
              errors: [],
              meta: { fields: [] }
            });
          }
        }, 0);
        return {} as any;
      });

      const file = createMockFile('test data');
      const result = await parseCSVFile(file, existingGuests);

      expect(result.valid).toEqual([
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
      ]);
      expect(result.duplicates).toEqual([
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
      ]);
    });

    it('detects duplicates within CSV data', async () => {
      const mockData = [
        ['First Name', 'Last Name', 'Email'],
        ['John', 'Doe', 'john@example.com'],
        ['John', 'Doe', 'john@example.com'] // Duplicate within CSV
      ];

      mockedPapa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          if (options.complete) {
            options.complete({
              data: mockData,
              errors: [],
              meta: { fields: [] }
            });
          }
        }, 0);
        return {} as any;
      });

      const file = createMockFile('test data');
      const result = await parseCSVFile(file, []);

      expect(result.valid).toEqual([
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
      ]);
      expect(result.duplicates).toEqual([
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
      ]);
    });

    it('validates required fields and reports errors', async () => {
      const mockData = [
        ['First Name', 'Last Name', 'Email'],
        ['', 'Doe', 'john@example.com'], // Missing first name
        ['Jane', '', 'jane@example.com'], // Missing last name
        ['Bob', 'Smith', ''], // Missing email
        ['Alice', 'Johnson', 'invalid-email'] // Invalid email
      ];

      mockedPapa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          if (options.complete) {
            options.complete({
              data: mockData,
              errors: [],
              meta: { fields: [] }
            });
          }
        }, 0);
        return {} as any;
      });

      const file = createMockFile('test data');
      const result = await parseCSVFile(file, []);

      expect(result.valid).toEqual([]);
      expect(result.invalid).toHaveLength(4);
      
      // Check specific validation errors
      expect(result.invalid).toContainEqual({
        row: 2,
        field: 'firstName',
        value: '',
        message: 'First name is required'
      });
      
      expect(result.invalid).toContainEqual({
        row: 3,
        field: 'lastName',
        value: '',
        message: 'Last name is required'
      });
      
      expect(result.invalid).toContainEqual({
        row: 4,
        field: 'email',
        value: '',
        message: 'Email is required'
      });
      
      expect(result.invalid).toContainEqual({
        row: 5,
        field: 'email',
        value: 'invalid-email',
        message: 'Invalid email format'
      });
    });

    it('handles optional fields (ticket type, order ID)', async () => {
      const mockData = [
        ['First Name', 'Last Name', 'Email', 'Ticket Type', 'Order ID'],
        ['John', 'Doe', 'john@example.com', 'VIP', '12345'],
        ['Jane', 'Smith', 'jane@example.com', '', ''] // Empty optional fields
      ];

      mockedPapa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          if (options.complete) {
            options.complete({
              data: mockData,
              errors: [],
              meta: { fields: [] }
            });
          }
        }, 0);
        return {} as any;
      });

      const file = createMockFile('test data');
      const result = await parseCSVFile(file, []);

      expect(result.valid).toEqual([
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com', ticketType: 'VIP', orderId: '12345' },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', ticketType: undefined, orderId: undefined }
      ]);
    });

    it('rejects CSV without required columns', async () => {
      const mockData = [
        ['Name', 'Phone'], // Missing required columns
        ['John Doe', '555-1234']
      ];

      mockedPapa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          if (options.complete) {
            options.complete({
              data: mockData,
              errors: [],
              meta: { fields: [] }
            });
          }
        }, 0);
        return {} as any;
      });

      const file = createMockFile('test data');
      
      await expect(parseCSVFile(file, [])).rejects.toThrow(
        'CSV file must contain First Name, Last Name, and Email columns'
      );
    });

    it('rejects empty CSV files', async () => {
      const mockData: string[][] = [];

      mockedPapa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          if (options.complete) {
            options.complete({
              data: mockData,
              errors: [],
              meta: { fields: [] }
            });
          }
        }, 0);
        return {} as any;
      });

      const file = createMockFile('');
      
      await expect(parseCSVFile(file, [])).rejects.toThrow(
        'CSV file must contain at least a header row and one data row'
      );
    });

    it('rejects CSV with only headers', async () => {
      const mockData = [
        ['First Name', 'Last Name', 'Email']
      ];

      mockedPapa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          if (options.complete) {
            options.complete({
              data: mockData,
              errors: [],
              meta: { fields: [] }
            });
          }
        }, 0);
        return {} as any;
      });

      const file = createMockFile('test data');
      
      await expect(parseCSVFile(file, [])).rejects.toThrow(
        'CSV file must contain at least a header row and one data row'
      );
    });

    it('handles Papa Parse errors', async () => {
      mockedPapa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          if (options.complete) {
            options.complete({
              data: [],
              errors: [{ message: 'Parse error', type: 'Delimiter', code: 'UndetectableDelimiter' }],
              meta: { fields: [] }
            });
          }
        }, 0);
        return {} as any;
      });

      const file = createMockFile('invalid data');
      
      await expect(parseCSVFile(file, [])).rejects.toThrow('CSV parsing failed: Parse error');
    });

    it('handles Papa Parse network/file errors', async () => {
      mockedPapa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          if (options.error) {
            options.error(new Error('File read error'));
          }
        }, 0);
        return {} as any;
      });

      const file = createMockFile('test data');
      
      await expect(parseCSVFile(file, [])).rejects.toThrow('Failed to parse CSV: File read error');
    });

    it('normalizes email addresses for comparison', async () => {
      const mockData = [
        ['First Name', 'Last Name', 'Email'],
        ['John', 'Doe', 'JOHN@EXAMPLE.COM']
      ];

      const existingGuests: Guest[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', checkedIn: false }
      ];

      mockedPapa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          if (options.complete) {
            options.complete({
              data: mockData,
              errors: [],
              meta: { fields: [] }
            });
          }
        }, 0);
        return {} as any;
      });

      const file = createMockFile('test data');
      const result = await parseCSVFile(file, existingGuests);

      expect(result.valid).toEqual([]);
      expect(result.duplicates).toEqual([
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
      ]);
    });
  });

  describe('exportGuestsToCSV', () => {
    // Mock DOM APIs
    beforeEach(() => {
      // Mock document.createElement
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          const mockAnchor = {
            setAttribute: jest.fn(),
            click: jest.fn(),
            style: { visibility: '' },
            href: '',
            download: ''
          } as any;
          return mockAnchor;
        }
        return document.createElement(tagName);
      });

      // Mock document.body methods
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as any));
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as any));

      // Mock URL methods
      global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
      global.URL.revokeObjectURL = jest.fn();

      // Mock Blob constructor
      global.Blob = jest.fn().mockImplementation((content, options) => ({
        type: options?.type || 'text/csv',
        size: content[0].length
      })) as any;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('exports guest list to CSV with correct format', () => {
      const guests: Guest[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', checkedIn: true },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', checkedIn: false }
      ];

      exportGuestsToCSV(guests, 'event123');

      // Verify Blob was created with correct content
      expect(global.Blob).toHaveBeenCalledWith(
        ['\uFEFF' + 'Name,Email,Check-in Status\nJohn Doe,john@example.com,Checked In\nJane Smith,jane@example.com,Not Checked In'],
        { type: 'text/csv;charset=utf-8;' }
      );

      // Verify download link was created and triggered
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
    });

    it('handles empty guest list', () => {
      const guests: Guest[] = [];

      exportGuestsToCSV(guests, 'event123');

      // Should still create CSV with headers only
      expect(global.Blob).toHaveBeenCalledWith(
        ['\uFEFF' + 'Name,Email,Check-in Status'],
        { type: 'text/csv;charset=utf-8;' }
      );
    });

    it('escapes special characters in guest data', () => {
      const guests: Guest[] = [
        { 
          id: '1', 
          name: 'John "Johnny" Doe, Jr.', 
          email: 'john@example.com', 
          checkedIn: true 
        },
        { 
          id: '2', 
          name: 'Jane\nSmith', 
          email: 'jane@example.com', 
          checkedIn: false 
        }
      ];

      exportGuestsToCSV(guests, 'event123');

      // Verify special characters are properly escaped
      const expectedContent = 'Name,Email,Check-in Status\n' +
        '"John ""Johnny"" Doe, Jr.",john@example.com,Checked In\n' +
        '"Jane\nSmith",jane@example.com,Not Checked In';

      expect(global.Blob).toHaveBeenCalledWith(
        ['\uFEFF' + expectedContent],
        { type: 'text/csv;charset=utf-8;' }
      );
    });

    it('generates filename with correct event ID and timestamp format', () => {
      const guests: Guest[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', checkedIn: true }
      ];

      // Mock Date.toISOString
      const mockDate = new Date('2023-12-01T10:30:45.123Z');
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate.toISOString());

      let mockAnchor: any;

      // Mock document.createElement to capture the anchor element when it's created
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          mockAnchor = {
            setAttribute: jest.fn(),
            click: jest.fn(),
            style: { visibility: '' },
            href: '',
            download: ''
          };
          return mockAnchor;
        }
        return document.createElement(tagName);
      });

      exportGuestsToCSV(guests, 'event123');

      // Verify the anchor element was configured with correct filename
      expect(mockAnchor.setAttribute).toHaveBeenCalledWith('download', 'event-event123-guests-2023-12-01T10-30-45.csv');
    });

    it('configures download link correctly', () => {
      const guests: Guest[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', checkedIn: true }
      ];

      let mockAnchor: any;

      // Mock document.createElement to capture the anchor element when it's created
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          mockAnchor = {
            setAttribute: jest.fn(),
            click: jest.fn(),
            style: { visibility: '' },
            href: '',
            download: ''
          };
          return mockAnchor;
        }
        return document.createElement(tagName);
      });

      exportGuestsToCSV(guests, 'event123');
      
      // Verify all anchor attributes are set correctly
      expect(mockAnchor.setAttribute).toHaveBeenCalledWith('href', 'mock-blob-url');
      expect(mockAnchor.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('event-event123-guests-'));
      expect(mockAnchor.style.visibility).toBe('hidden');
      
      // Verify DOM manipulation
      expect(document.body.appendChild).toHaveBeenCalledWith(mockAnchor);
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockAnchor);
    });
  });
}); 