import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CSVUploader from './CSVUploader';
import { Event, Guest } from '../types';
import * as csvUtils from '../utils/csvUtils';

// Mock the csvUtils module
jest.mock('../utils/csvUtils');
const mockedCsvUtils = csvUtils as jest.Mocked<typeof csvUtils>;

// Mock the useAriaLiveAnnouncements hook
jest.mock('../hooks/useAriaLiveAnnouncements', () => ({
  useAriaLiveAnnouncements: () => ({
    announcement: '',
    announce: jest.fn()
  })
}));

describe('CSVUploader', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Test Event 1',
      date: '2024-06-15',
      guestList: [
        { id: '1', name: 'John Doe', email: 'john@example.com', checkedIn: false },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', checkedIn: true }
      ]
    },
    {
      id: '2',
      title: 'Test Event 2',
      date: '2024-06-22',
      guestList: [
        { id: '3', name: 'Bob Wilson', email: 'bob@example.com', checkedIn: false }
      ]
    }
  ];

  const defaultProps = {
    events: mockEvents,
    selectedEventId: '1',
    onEventChange: jest.fn(),
    onImportComplete: jest.fn(),
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockedCsvUtils.validateFile.mockReturnValue(null);
    mockedCsvUtils.parseCSVFile.mockResolvedValue({
      valid: [
        { firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com' },
        { firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com' }
      ],
      duplicates: [],
      invalid: [],
      totalRows: 2
    });
    mockedCsvUtils.csvGuestToGuest.mockImplementation((csvGuest) => ({
      id: 'test-id',
      name: `${csvGuest.firstName} ${csvGuest.lastName}`,
      email: csvGuest.email,
      checkedIn: false
    }));
  });

  describe('Initial Render', () => {
    it('renders the CSV uploader modal', () => {
      render(<CSVUploader {...defaultProps} />);
      
      expect(screen.getByText('Import Guest List from CSV')).toBeInTheDocument();
      expect(screen.getByText('Select Event to Import To:')).toBeInTheDocument();
      expect(screen.getByText('Drag and drop your CSV file here, or')).toBeInTheDocument();
    });

    it('displays event selection dropdown with correct options', () => {
      render(<CSVUploader {...defaultProps} />);
      
      const select = screen.getByLabelText('Select Event to Import To:');
      expect(select).toHaveValue('1');
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('Test Event 1 (2 current guests)');
      expect(options[1]).toHaveTextContent('Test Event 2 (1 current guests)');
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<CSVUploader {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('Close CSV uploader');
      await user.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Event Selection', () => {
    it('calls onEventChange when event is selected', async () => {
      const user = userEvent.setup();
      render(<CSVUploader {...defaultProps} />);
      
      const select = screen.getByLabelText('Select Event to Import To:');
      await user.selectOptions(select, '2');
      
      expect(defaultProps.onEventChange).toHaveBeenCalledWith('2');
    });
  });

  describe('File Upload', () => {
    it('handles file selection via input', async () => {
      const user = userEvent.setup();
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      expect(mockedCsvUtils.validateFile).toHaveBeenCalledWith(file);
      expect(mockedCsvUtils.parseCSVFile).toHaveBeenCalledWith(file, expect.any(Array));
    });

    it('handles browse button click', async () => {
      const user = userEvent.setup();
      render(<CSVUploader {...defaultProps} />);
      
      const browseButton = screen.getByText('browse');
      await user.click(browseButton);
      
      // The hidden file input should be triggered (implementation detail)
      const input = screen.getByLabelText('Select CSV file');
      expect(input).toBeInTheDocument();
    });

    it('handles drag and drop', async () => {
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const dropArea = screen.getByText('Drag and drop your CSV file here, or').closest('div');
      
      if (dropArea) {
        // Simulate drag over
        fireEvent.dragOver(dropArea);
        
        // Simulate drop
        fireEvent.drop(dropArea, {
          dataTransfer: {
            files: [file]
          }
        });
      }
      
      expect(mockedCsvUtils.validateFile).toHaveBeenCalledWith(file);
    });

    it('shows error for invalid file', async () => {
      // Set the mock before rendering
      mockedCsvUtils.validateFile.mockReturnValue('Invalid file type');
      
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByLabelText('Select CSV file');
      
      // Use fireEvent.change instead of user.upload for more direct control
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(input);
      
      // Verify the mock was called
      expect(mockedCsvUtils.validateFile).toHaveBeenCalledWith(file);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid file type')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('CSV Processing', () => {
    it('shows progress during file processing', async () => {
      const user = userEvent.setup();
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText('Processing complete')).toBeInTheDocument();
      });
    });

    it('displays import results summary', async () => {
      const user = userEvent.setup();
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText('Import Summary')).toBeInTheDocument();
        // Check for total rows in the summary section
        const summarySection = screen.getByText('Import Summary').closest('div');
        expect(summarySection).toHaveTextContent('2');
        expect(screen.getByText('Total Rows')).toBeInTheDocument();
        expect(screen.getByText('Valid Guests')).toBeInTheDocument();
      });
    });

    it('shows duplicate guests section when duplicates exist', async () => {
      const user = userEvent.setup();
      mockedCsvUtils.parseCSVFile.mockResolvedValue({
        valid: [],
        duplicates: [
          { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
        ],
        invalid: [],
        totalRows: 1
      });
      
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText('Duplicate Guests Found (1)')).toBeInTheDocument();
        expect(screen.getByText('John Doe (john@example.com)')).toBeInTheDocument();
      });
    });

    it('shows validation errors when invalid data exists', async () => {
      const user = userEvent.setup();
      mockedCsvUtils.parseCSVFile.mockResolvedValue({
        valid: [],
        duplicates: [],
        invalid: [
          { row: 2, field: 'email', value: 'invalid-email', message: 'Invalid email format' }
        ],
        totalRows: 1
      });
      
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText('Validation Errors (1)')).toBeInTheDocument();
        expect(screen.getByText(/Row 2: Invalid email format/)).toBeInTheDocument();
      });
    });

    it('handles CSV parsing errors', async () => {
      const user = userEvent.setup();
      mockedCsvUtils.parseCSVFile.mockRejectedValue(new Error('Parsing failed'));
      
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText('Parsing failed')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Duplicate Handling', () => {
    beforeEach(() => {
      mockedCsvUtils.parseCSVFile.mockResolvedValue({
        valid: [
          { firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com' }
        ],
        duplicates: [
          { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
        ],
        invalid: [],
        totalRows: 3
      });
    });

    it('allows selecting/deselecting duplicate guests', async () => {
      const user = userEvent.setup();
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      await waitFor(() => {
        const checkbox = screen.getByLabelText(/John Doe/);
        expect(checkbox).not.toBeChecked();
        
        // Select duplicate
        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
        
        // Deselect duplicate
        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
      });
    });

    it('updates import button text based on selection', async () => {
      const user = userEvent.setup();
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      await waitFor(() => {
        // Initially only valid guests
        expect(screen.getByText(/Import 1 Guests to/)).toBeInTheDocument();
        
        // Select a duplicate
        const checkbox = screen.getByLabelText(/John Doe/);
        fireEvent.click(checkbox);
        
        // Should now show 2 guests (1 valid + 1 selected duplicate)
        expect(screen.getByText(/Import 2 Guests to/)).toBeInTheDocument();
      });
    });
  });

  describe('Import Process', () => {
    it('calls onImportComplete with correct data', async () => {
      const user = userEvent.setup();
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      await waitFor(() => {
        const importButton = screen.getByText(/Import.*Guests to/);
        fireEvent.click(importButton);
      });
      
      expect(defaultProps.onImportComplete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'test-id',
            name: 'Alice Johnson',
            email: 'alice@example.com'
          })
        ]),
        '1'
      );
    });

    it('disables import button when no valid guests', async () => {
      const user = userEvent.setup();
      mockedCsvUtils.parseCSVFile.mockResolvedValue({
        valid: [],
        duplicates: [],
        invalid: [
          { row: 1, field: 'email', value: '', message: 'Email is required' }
        ],
        totalRows: 1
      });
      
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      await waitFor(() => {
        const importButton = screen.getByText(/Import.*Guests to/);
        expect(importButton).toBeDisabled();
      });
    });

    it('allows uploading a different file', async () => {
      const user = userEvent.setup();
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      await waitFor(() => {
        const uploadDifferentButton = screen.getByText('Upload Different File');
        fireEvent.click(uploadDifferentButton);
      });
      
      // Should reset to initial state
      expect(screen.getByText('Drag and drop your CSV file here, or')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<CSVUploader {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Close CSV uploader')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Event to Import To:')).toBeInTheDocument();
      expect(screen.getByLabelText('Select CSV file')).toBeInTheDocument();
    });

    it('announces important state changes', async () => {
      const user = userEvent.setup();
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      // Check that ARIA live region is present
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      mockedCsvUtils.parseCSVFile.mockRejectedValue(new Error('Network error'));
      
      render(<CSVUploader {...defaultProps} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('handles import failures', async () => {
      const user = userEvent.setup();
      const failingOnImportComplete = jest.fn(() => {
        throw new Error('Import failed');
      });
      
      render(<CSVUploader {...defaultProps} onImportComplete={failingOnImportComplete} />);
      
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      const input = screen.getByLabelText('Select CSV file');
      
      await user.upload(input, file);
      
      await waitFor(() => {
        const importButton = screen.getByText(/Import.*Guests to/);
        fireEvent.click(importButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Import failed')).toBeInTheDocument();
      });
    });
  });
}); 