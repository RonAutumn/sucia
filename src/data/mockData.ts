import { Event, Guest } from '../types';

// Mock guest data with diverse names, alphabetically sortable
const createGuest = (id: number, name: string, email: string, checkedIn: boolean = false): Guest => ({
  id: id.toString(),
  name,
  email,
  checkedIn,
});

const meetupGuests: Guest[] = [
  createGuest(1, 'Aaliyah Johnson', 'aaliyah.johnson@email.com'),
  createGuest(2, 'Benjamin Chen', 'benjamin.chen@email.com'),
  createGuest(3, 'Carlos Rodriguez', 'carlos.rodriguez@email.com'),
  createGuest(4, 'Destiny Williams', 'destiny.williams@email.com'),
  createGuest(5, 'Elena Kowalski', 'elena.kowalski@email.com'),
  createGuest(6, 'Fatima Al-Hassan', 'fatima.alhassan@email.com'),
  createGuest(7, 'Gabriel Martinez', 'gabriel.martinez@email.com'),
  createGuest(8, 'Hana Kim', 'hana.kim@email.com', true),
  createGuest(9, 'Isaiah Thompson', 'isaiah.thompson@email.com'),
  createGuest(10, 'Jasmine Patel', 'jasmine.patel@email.com', true),
  createGuest(11, 'Kevin O\'Connor', 'kevin.oconnor@email.com'),
  createGuest(12, 'Lila Singh', 'lila.singh@email.com'),
  createGuest(13, 'Marcus Brown', 'marcus.brown@email.com', true),
  createGuest(14, 'Naomi Davis', 'naomi.davis@email.com'),
  createGuest(15, 'Omar Jackson', 'omar.jackson@email.com'),
  createGuest(16, 'Priya Sharma', 'priya.sharma@email.com'),
  createGuest(17, 'Quinn Taylor', 'quinn.taylor@email.com'),
  createGuest(18, 'Rosa Gutierrez', 'rosa.gutierrez@email.com'),
  createGuest(19, 'Samuel Lee', 'samuel.lee@email.com', true),
  createGuest(20, 'Tanya Okafor', 'tanya.okafor@email.com'),
];

const suciaReadGuests: Guest[] = [
  createGuest(21, 'Amara Jones', 'amara.jones@email.com'),
  createGuest(22, 'Blake Henderson', 'blake.henderson@email.com', true),
  createGuest(23, 'Camila Santos', 'camila.santos@email.com'),
  createGuest(24, 'David Park', 'david.park@email.com'),
  createGuest(25, 'Esperanza Lopez', 'esperanza.lopez@email.com'),
  createGuest(26, 'Felix Andersson', 'felix.andersson@email.com'),
  createGuest(27, 'Grace Liu', 'grace.liu@email.com', true),
  createGuest(28, 'Hassan Mohamed', 'hassan.mohamed@email.com'),
  createGuest(29, 'Iris Nakamura', 'iris.nakamura@email.com'),
  createGuest(30, 'Jamal Wilson', 'jamal.wilson@email.com'),
  createGuest(31, 'Kiara Smith', 'kiara.smith@email.com'),
  createGuest(32, 'Lucas Zhang', 'lucas.zhang@email.com', true),
  createGuest(33, 'Maya Reyes', 'maya.reyes@email.com'),
  createGuest(34, 'Nikolai Petrov', 'nikolai.petrov@email.com'),
  createGuest(35, 'Olivia Green', 'olivia.green@email.com'),
  createGuest(36, 'Phoenix Wright', 'phoenix.wright@email.com'),
  createGuest(37, 'Quentin Adams', 'quentin.adams@email.com'),
  createGuest(38, 'Ravi Kumar', 'ravi.kumar@email.com', true),
  createGuest(39, 'Sophia Miller', 'sophia.miller@email.com'),
  createGuest(40, 'Tamir Cohen', 'tamir.cohen@email.com'),
];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'NYC Tech Meetup',
    date: '2024-06-15',
    guestList: meetupGuests,
  },
  {
    id: '2',
    title: 'Sucia Read',
    date: '2024-06-22',
    guestList: suciaReadGuests,
  },
];

// Export events with additional fields for the new routing components
export const events = [
  {
    id: '1',
    name: 'NYC Tech Meetup',
    description: 'Monthly networking event for NYC tech professionals',
    date: 'June 15, 2024',
    location: 'WeWork Union Square, NYC',
    guests: meetupGuests,
  },
  {
    id: '2',
    name: 'Sucia Read',
    description: 'Monthly book club meeting and discussion',
    date: 'June 22, 2024',
    location: 'Brooklyn Public Library',
    guests: suciaReadGuests,
  },
];

export default mockEvents; 