import { useState, useEffect, useCallback } from 'react';
import { createGameStateManager } from '../../utils/gameStateManager';
import { Guest } from '../../types';

interface ParticipantManagerResult {
  participants: string[];
  isParticipant: (guestId: string) => boolean;
  addParticipant: (guestId: string, consent?: boolean) => Promise<boolean>;
  removeParticipant: (guestId: string) => Promise<boolean>;
  getParticipantCount: () => number;
  getParticipantDetails: (guestId: string) => Guest | undefined;
  hasConsent: (guestId: string) => boolean;
  updateConsent: (guestId: string, consent: boolean) => void;
  bulkAddParticipants: (guestIds: string[]) => Promise<number>;
  clearAllParticipants: () => Promise<boolean>;
}

interface ConsentRecord {
  guestId: string;
  consent: boolean;
  timestamp: Date;
}

/**
 * Hook for managing game participants with consent flows
 * Integrates with existing guest infrastructure and gameStateManager
 */
export function useParticipantManager(
  eventId: string,
  gameId: string | null,
  availableGuests: Guest[],
  staffId: string = 'staff-default'
): ParticipantManagerResult {
  const [participants, setParticipants] = useState<string[]>([]);
  const [consentRecords, setConsentRecords] = useState<Map<string, ConsentRecord>>(new Map());
  
  const gameStateManager = createGameStateManager(eventId);

  // Load initial participants and consent data
  useEffect(() => {
    if (!gameId) return;
    
    const loadedParticipants = gameStateManager.loadGameParticipants(gameId);
    setParticipants(loadedParticipants);
    
    // Load consent records from localStorage
    const consentKey = `gameConsent-${eventId}-${gameId}`;
    const storedConsent = localStorage.getItem(consentKey);
    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent);
        const consentMap = new Map();
        parsed.forEach((record: any) => {
          consentMap.set(record.guestId, {
            ...record,
            timestamp: new Date(record.timestamp)
          });
        });
        setConsentRecords(consentMap);
      } catch (error) {
        console.error('Failed to load consent records:', error);
      }
    }
  }, [eventId, gameId]);

  // Persist consent records to localStorage
  const persistConsentRecords = useCallback((records: Map<string, ConsentRecord>) => {
    if (!gameId) return;
    
    const consentKey = `gameConsent-${eventId}-${gameId}`;
    const recordsArray = Array.from(records.values());
    localStorage.setItem(consentKey, JSON.stringify(recordsArray));
  }, [eventId, gameId]);

  const isParticipant = useCallback((guestId: string): boolean => {
    return participants.includes(guestId);
  }, [participants]);

  const hasConsent = useCallback((guestId: string): boolean => {
    const record = consentRecords.get(guestId);
    return record?.consent === true;
  }, [consentRecords]);

  const updateConsent = useCallback((guestId: string, consent: boolean) => {
    const newRecord: ConsentRecord = {
      guestId,
      consent,
      timestamp: new Date()
    };
    
    const updatedRecords = new Map(consentRecords);
    updatedRecords.set(guestId, newRecord);
    setConsentRecords(updatedRecords);
    persistConsentRecords(updatedRecords);
  }, [consentRecords, persistConsentRecords]);

  const addParticipant = useCallback(async (guestId: string, consent: boolean = true): Promise<boolean> => {
    if (!gameId || isParticipant(guestId)) return false;
    
    // Check if guest exists in available guests
    const guestExists = availableGuests.some(guest => guest.id === guestId);
    if (!guestExists) {
      console.warn(`Guest ${guestId} not found in available guests`);
      return false;
    }
    
    try {
      // Update consent first
      updateConsent(guestId, consent);
      
      // Only add if consent is given
      if (consent) {
        const success = gameStateManager.addParticipant(gameId, guestId, staffId);
        if (success) {
          const updatedParticipants = [...participants, guestId];
          setParticipants(updatedParticipants);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to add participant:', error);
      return false;
    }
  }, [gameId, participants, staffId, availableGuests, isParticipant, updateConsent, gameStateManager]);

  const removeParticipant = useCallback(async (guestId: string): Promise<boolean> => {
    if (!gameId || !isParticipant(guestId)) return false;
    
    try {
      const success = gameStateManager.removeParticipant(gameId, guestId, staffId);
      if (success) {
        const updatedParticipants = participants.filter(id => id !== guestId);
        setParticipants(updatedParticipants);
        
        // Update consent to false when removing
        updateConsent(guestId, false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove participant:', error);
      return false;
    }
  }, [gameId, participants, staffId, isParticipant, updateConsent, gameStateManager]);

  const getParticipantCount = useCallback((): number => {
    return participants.length;
  }, [participants]);

  const getParticipantDetails = useCallback((guestId: string): Guest | undefined => {
    return availableGuests.find(guest => guest.id === guestId);
  }, [availableGuests]);

  const bulkAddParticipants = useCallback(async (guestIds: string[]): Promise<number> => {
    if (!gameId) return 0;
    
    let successCount = 0;
    
    for (const guestId of guestIds) {
      const success = await addParticipant(guestId, true);
      if (success) successCount++;
    }
    
    return successCount;
  }, [gameId, addParticipant]);

  const clearAllParticipants = useCallback(async (): Promise<boolean> => {
    if (!gameId) return false;
    
    try {
      // Remove all participants individually to maintain audit trail
      const removalPromises = participants.map(guestId => removeParticipant(guestId));
      const results = await Promise.all(removalPromises);
      
      // Return true if all removals were successful
      return results.every(result => result === true);
    } catch (error) {
      console.error('Failed to clear all participants:', error);
      return false;
    }
  }, [gameId, participants, removeParticipant]);

  return {
    participants,
    isParticipant,
    addParticipant,
    removeParticipant,
    getParticipantCount,
    getParticipantDetails,
    hasConsent,
    updateConsent,
    bulkAddParticipants,
    clearAllParticipants
  };
} 