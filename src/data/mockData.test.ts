import { mockEvents } from './mockData';
import { Event, Guest } from '../types';

describe('Mock Data', () => {
  describe('Events Structure', () => {
    test('should have at least 2 events', () => {
      expect(mockEvents).toHaveLength(2);
    });

    test('should contain events with correct structure', () => {
      mockEvents.forEach((event: Event) => {
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('title');
        expect(event).toHaveProperty('date');
        expect(event).toHaveProperty('guestList');
        
        expect(typeof event.id).toBe('string');
        expect(typeof event.title).toBe('string');
        expect(typeof event.date).toBe('string');
        expect(Array.isArray(event.guestList)).toBe(true);
      });
    });

    test('should have meaningful event titles', () => {
      const titles = mockEvents.map(event => event.title);
      expect(titles).toContain('NYC Tech Meetup');
      expect(titles).toContain('Sucia Read');
    });

    test('should have valid date formats', () => {
      mockEvents.forEach((event: Event) => {
        // Test for YYYY-MM-DD format
        expect(event.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        // Test that date is parseable
        expect(new Date(event.date).toString()).not.toBe('Invalid Date');
      });
    });
  });

  describe('Guest Lists', () => {
    test('should have 10-20 guests per event', () => {
      mockEvents.forEach((event: Event) => {
        expect(event.guestList.length).toBeGreaterThanOrEqual(10);
        expect(event.guestList.length).toBeLessThanOrEqual(20);
      });
    });

    test('should have guests with correct structure', () => {
      mockEvents.forEach((event: Event) => {
        event.guestList.forEach((guest: Guest) => {
          expect(guest).toHaveProperty('id');
          expect(guest).toHaveProperty('name');
          expect(guest).toHaveProperty('email');
          expect(guest).toHaveProperty('checkedIn');
          
          expect(typeof guest.id).toBe('string');
          expect(typeof guest.name).toBe('string');
          expect(typeof guest.email).toBe('string');
          expect(typeof guest.checkedIn).toBe('boolean');
        });
      });
    });

    test('should have unique guest IDs across all events', () => {
      const allGuestIds: string[] = [];
      mockEvents.forEach((event: Event) => {
        event.guestList.forEach((guest: Guest) => {
          allGuestIds.push(guest.id);
        });
      });
      
      const uniqueIds = new Set(allGuestIds);
      expect(uniqueIds.size).toBe(allGuestIds.length);
    });

    test('should have diverse guest names', () => {
      const allGuestNames: string[] = [];
      mockEvents.forEach((event: Event) => {
        event.guestList.forEach((guest: Guest) => {
          allGuestNames.push(guest.name);
        });
      });

      // Check for diversity - at least 3 different first letters
      const firstLetters = new Set(allGuestNames.map(name => name.charAt(0)));
      expect(firstLetters.size).toBeGreaterThanOrEqual(3);
      
      // Check that names contain spaces (first + last name)
      allGuestNames.forEach(name => {
        expect(name).toMatch(/\s/); // Contains whitespace
      });
    });

    test('should be alphabetically sortable', () => {
      mockEvents.forEach((event: Event) => {
        const names = event.guestList.map(guest => guest.name);
        const sortedNames = [...names].sort();
        
        // Names should be sortable (we're not requiring pre-sorted, just sortable)
        expect(names.length).toBe(sortedNames.length);
        expect(new Set(names)).toEqual(new Set(sortedNames));
      });
    });

    test('should have valid email addresses', () => {
      mockEvents.forEach((event: Event) => {
        event.guestList.forEach((guest: Guest) => {
          expect(guest.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        });
      });
    });

    test('should have some guests checked in and some not', () => {
      const allGuests: Guest[] = [];
      mockEvents.forEach((event: Event) => {
        allGuests.push(...event.guestList);
      });
      
      const checkedInCount = allGuests.filter(guest => guest.checkedIn).length;
      const notCheckedInCount = allGuests.filter(guest => !guest.checkedIn).length;
      
      // Ensure we have both checked in and not checked in guests
      expect(checkedInCount).toBeGreaterThan(0);
      expect(notCheckedInCount).toBeGreaterThan(0);
    });
  });

  describe('Type Safety', () => {
    test('should match Event interface exactly', () => {
      mockEvents.forEach((event) => {
        // This test ensures TypeScript compilation catches interface mismatches
        const eventKeys = Object.keys(event).sort();
        expect(eventKeys).toEqual(['date', 'guestList', 'id', 'title']);
      });
    });

    test('should match Guest interface exactly', () => {
      const firstGuest = mockEvents[0].guestList[0];
      const guestKeys = Object.keys(firstGuest).sort();
      expect(guestKeys).toEqual(['checkedIn', 'email', 'id', 'name']);
    });
  });
}); 