import React, { useState, useCallback, useRef } from 'react';
import { CSVImportResult, CSVUploadProgress, Guest, Event, CSVGuest } from '../types';
import { parseCSVFile, validateFile, csvGuestToGuest } from '../utils/csvUtils';
import { useAriaLiveAnnouncements } from '../hooks/useAriaLiveAnnouncements';
import AriaLiveRegion from './AriaLiveRegion';

interface CSVUploaderProps {
  events: Event[];
  selectedEventId: string;
  onEventChange: (eventId: string) => void;
  onImportComplete: (importedGuests: Guest[], eventId: string) => void;
  onClose: () => void;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({
  events,
  selectedEventId,
  onEventChange,
  onImportComplete,
  onClose
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<CSVUploadProgress | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { announcement, announce } = useAriaLiveAnnouncements();

  // Get existing guests for duplicate detection
  const getExistingGuests = useCallback((): Guest[] => {
    return events.reduce((allGuests: Guest[], event) => {
      return [...allGuests, ...event.guestList];
    }, []);
  }, [events]);

  const resetState = () => {
    setFile(null);
    setProgress(null);
    setImportResult(null);
    setError(null);
    setSelectedDuplicates(new Set());
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = async (selectedFile: File) => {
    setError(null);
    setImportResult(null);

    // Validate file
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      announce(`File validation failed: ${validationError}`);
      return;
    }

    setFile(selectedFile);
    announce(`File selected: ${selectedFile.name}`);

    // Start processing
    await processFile(selectedFile);
  };

  const processFile = async (fileToProcess: File) => {
    try {
      setProgress({ stage: 'parsing', progress: 25, message: 'Parsing CSV file...' });
      announce('Parsing CSV file...');

      const existingGuests = getExistingGuests();
      
      setProgress({ stage: 'validating', progress: 50, message: 'Validating data...' });
      const result = await parseCSVFile(fileToProcess, existingGuests);
      
      setProgress({ stage: 'complete', progress: 100, message: 'Processing complete' });
      setImportResult(result);
      
      announce(`Processing complete. Found ${result.valid.length} valid guests, ${result.duplicates.length} duplicates, and ${result.invalid.length} validation errors.`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      announce(`Error processing file: ${errorMessage}`);
      setProgress(null);
    }
  };

  const handleDuplicateToggle = (email: string) => {
    const newSelection = new Set(selectedDuplicates);
    if (newSelection.has(email)) {
      newSelection.delete(email);
    } else {
      newSelection.add(email);
    }
    setSelectedDuplicates(newSelection);
  };

  const handleImport = () => {
    if (!importResult) return;

    try {
      setProgress({ stage: 'importing', progress: 75, message: 'Importing guests...' });
      
      // Convert valid guests to Guest format
      const guestsToImport = importResult.valid.map(csvGuestToGuest);
      
      // Add selected duplicates (replace existing)
      const selectedDuplicateGuests = importResult.duplicates
        .filter(duplicate => selectedDuplicates.has(duplicate.email))
        .map(csvGuestToGuest);
      
      const allImportedGuests = [...guestsToImport, ...selectedDuplicateGuests];
      
      onImportComplete(allImportedGuests, selectedEventId);
      
      setProgress({ stage: 'complete', progress: 100, message: 'Import completed successfully!' });
      announce(`Import completed successfully! Imported ${allImportedGuests.length} guests.`);
      
      // Close after a brief delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setError(errorMessage);
      announce(`Import failed: ${errorMessage}`);
      setProgress(null);
    }
  };

  const getSelectedEvent = () => events.find(e => e.id === selectedEventId);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" role="dialog" aria-modal="true" aria-labelledby="csv-uploader-title">
      <AriaLiveRegion announcement={announcement} />
      
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 id="csv-uploader-title" className="text-2xl font-bold text-gray-900 font-display">
            Import Guest List from CSV
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            aria-label="Close CSV uploader"
          >
            ×
          </button>
        </div>

        {/* Event Selection */}
        <div className="mb-6">
          <label htmlFor="event-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Event to Import To:
          </label>
          <select
            id="event-select"
            value={selectedEventId}
            onChange={(e) => onEventChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.title} ({event.guestList.length} current guests)
              </option>
            ))}
          </select>
        </div>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            
            <div>
              <p className="text-sm text-gray-600">
                {file ? (
                  <span className="font-medium text-gray-900">{file.name}</span>
                ) : (
                  <>
                    Drag and drop your CSV file here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      browse
                    </button>
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports ForbiddenTickets export format. Maximum file size: 5MB
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
              aria-label="Select CSV file"
            />
          </div>
        </div>

        {/* Progress Indicator */}
        {progress && (
          <div className="mt-6">
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
              <span>{progress.message}</span>
              <span>{progress.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="mt-6 space-y-6">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Import Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{importResult.totalRows}</div>
                  <div className="text-gray-600">Total Rows</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.valid.length}</div>
                  <div className="text-gray-600">Valid Guests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates.length}</div>
                  <div className="text-gray-600">Duplicates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{importResult.invalid.length}</div>
                  <div className="text-gray-600">Invalid</div>
                </div>
              </div>
            </div>

            {/* Duplicates Section */}
            {importResult.duplicates.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-yellow-800 mb-3">
                  Duplicate Guests Found ({importResult.duplicates.length})
                </h4>
                <p className="text-sm text-yellow-700 mb-4">
                  These guests already exist in the system. Select which ones you want to import (this will replace the existing guest data):
                </p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {importResult.duplicates.map((duplicate, index) => (
                    <label key={index} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDuplicates.has(duplicate.email)}
                        onChange={() => handleDuplicateToggle(duplicate.email)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        {duplicate.firstName} {duplicate.lastName} ({duplicate.email})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Errors */}
            {importResult.invalid.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-red-800 mb-3">
                  Validation Errors ({importResult.invalid.length})
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.invalid.map((error, index) => (
                    <div key={index} className="text-sm text-red-700">
                      Row {error.row}: {error.message} (field: {error.field}, value: "{error.value}")
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={resetState}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Upload Different File
              </button>
              <button
                onClick={handleImport}
                disabled={importResult.valid.length === 0 && selectedDuplicates.size === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Import {importResult.valid.length + selectedDuplicates.size} Guests to "{getSelectedEvent()?.title}"
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVUploader; 