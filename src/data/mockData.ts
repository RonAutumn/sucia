import { 
  Event, 
  Guest, 
  CheckInStatus, 
  CsvUploadResult, 
  CsvFieldMapping,
  Game,
  Poll,
  TriviaQuestion,
  IcebreakerPrompt
} from '../types';

// Mock guest data with diverse names reflecting Sucia NYC's community
const createGuest = (id: number, name: string, email: string, checkedIn: boolean = false): Guest => ({
  id: id.toString(),
  name,
  email,
  checkedIn,
});

// Sucia Sundays guest list - queer community members
const suciaSundaysGuests: Guest[] = [
  createGuest(1, 'Aaliyah "Queen Roja" Rivera', 'aaliyah.rivera@protonmail.com'),
  createGuest(2, 'Benjamín Chen-Vásquez', 'benjamin.chen.v@email.com'),
  createGuest(3, 'Carmen "Corazón" Rodriguez', 'carmen.corazon@riseup.net'),
  createGuest(4, 'Destiny "DJ Melanin" Williams', 'destiny.melanin@email.com'),
  createGuest(5, 'Elena "Brujita" Kowalski', 'elena.brujita@protonmail.com'),
  createGuest(6, 'Fatima Al-Hassan', 'fatima.alhassan@signal.com', true),
  createGuest(7, 'Gabriel "Gigi" Martinez', 'gabriel.gigi@email.com'),
  createGuest(8, 'Hana "Cyber Femme" Kim', 'hana.cyberfemme@protonmail.com', true),
  createGuest(9, 'Isaiah "Isa" Thompson', 'isaiah.isa@email.com'),
  createGuest(10, 'Jasmine "Jazz" Patel', 'jasmine.jazz@riseup.net', true),
  createGuest(11, 'Kevin "Kevyn" O\'Connor', 'kevin.kevyn@email.com'),
  createGuest(12, 'Lila "Luna" Singh', 'lila.luna@protonmail.com'),
  createGuest(13, 'Marcus "Marz" Brown', 'marcus.marz@email.com', true),
  createGuest(14, 'Naomi "Nao" Davis', 'naomi.nao@signal.com'),
  createGuest(15, 'Omar "Jade" Jackson', 'omar.jade@email.com'),
  createGuest(16, 'Priya "Phoenix" Sharma', 'priya.phoenix@protonmail.com'),
  createGuest(17, 'Quinn "Q" Taylor', 'quinn.q@email.com'),
  createGuest(18, 'Rosa "Rebelde" Gutierrez', 'rosa.rebelde@riseup.net'),
  createGuest(19, 'Samuel "Sage" Lee', 'samuel.sage@email.com', true),
  createGuest(20, 'Tanya "Tierra" Okafor', 'tanya.tierra@protonmail.com'),
];

// WHORECHATA guest list - transcultural queer elite
const whorechataGuests: Guest[] = [
  createGuest(21, 'Amara "Morena" Jones', 'amara.morena@riseup.net'),
  createGuest(22, 'Blake "Boi Magia" Henderson', 'blake.boimagia@protonmail.com', true),
  createGuest(23, 'Camila "Cami Fuego" Santos', 'camila.fuego@signal.com'),
  createGuest(24, 'David "Davi Luz" Park', 'david.daviluz@email.com'),
  createGuest(25, 'Esperanza "Espe" Lopez', 'esperanza.espe@riseup.net'),
  createGuest(26, 'Felix "Fe" Andersson', 'felix.fe@protonmail.com'),
  createGuest(27, 'Grace "Gracia" Liu', 'grace.gracia@email.com', true),
  createGuest(28, 'Hassan "Hass" Mohamed', 'hassan.hass@signal.com'),
  createGuest(29, 'Iris "Iri" Nakamura', 'iris.iri@email.com'),
  createGuest(30, 'Jamal "Jamz" Wilson', 'jamal.jamz@protonmail.com'),
  createGuest(31, 'Kiara "Ki" Smith', 'kiara.ki@email.com'),
  createGuest(32, 'Lucas "Lux" Zhang', 'lucas.lux@riseup.net', true),
  createGuest(33, 'Maya "Maia Sol" Reyes', 'maya.maiasol@signal.com'),
  createGuest(34, 'Nikolai "Niko" Petrov', 'nikolai.niko@email.com'),
  createGuest(35, 'Olivia "Oli Verde" Green', 'olivia.oliverde@protonmail.com'),
  createGuest(36, 'Phoenix "Fenix" Wright', 'phoenix.fenix@email.com'),
  createGuest(37, 'Quentin "Quen" Adams', 'quentin.quen@riseup.net'),
  createGuest(38, 'Ravi "Ravi Corazón" Kumar', 'ravi.corazon@signal.com', true),
  createGuest(39, 'Sophia "Sofi Rebel" Miller', 'sophia.rebel@protonmail.com'),
  createGuest(40, 'Tamir "Tami" Cohen', 'tamir.tami@email.com'),
];

// Sustaining the Resistance workshop attendees
const resistanceWorkshopGuests: Guest[] = [
  createGuest(41, 'Alex "Activist" Rivera', 'alex.activist@riseup.net'),
  createGuest(42, 'Jordan "Jor" Kim', 'jordan.jor@protonmail.com'),
  createGuest(43, 'Casey "Care" Thompson', 'casey.care@signal.com', true),
  createGuest(44, 'River "Riv" Martinez', 'river.riv@email.com'),
  createGuest(45, 'Sage "Sabia" Chen', 'sage.sabia@riseup.net'),
  createGuest(46, 'Nova "Nov" Williams', 'nova.nov@protonmail.com', true),
  createGuest(47, 'Zara "Z" Patel', 'zara.z@signal.com'),
  createGuest(48, 'Rowan "Row" Davis', 'rowan.row@email.com'),
  createGuest(49, 'Indigo "Indi" Lopez', 'indigo.indi@protonmail.com'),
  createGuest(50, 'Poet "Po" Jackson', 'poet.po@riseup.net', true),
];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Sucia Sundays',
    date: '2025-06-15',
    guestList: suciaSundaysGuests,
  },
  {
    id: '2',
    title: 'WHORECHATA',
    date: '2025-06-22',
    guestList: whorechataGuests,
  },
  {
    id: '3',
    title: 'Sustaining the Resistance',
    date: '2025-06-29',
    guestList: resistanceWorkshopGuests,
  },
];

// Export events with additional fields for the new routing components
export const events = [
  {
    id: '1',
    name: 'Sucia Sundays',
    description: 'Monthly play party & body-positive dance space for QTBIPOC community with kink-friendly zones and sensory play areas',
    date: 'June 15, 2025',
    location: 'Casa de Galindo, Brooklyn',
    guests: suciaSundaysGuests,
  },
  {
    id: '2',
    name: 'WHORECHATA',
    description: 'Transcultural queer nightlife with Latinx underground DJs, decolonial pleasure activism, and anti-assimilationist dress codes',
    date: 'June 22, 2025',
    location: 'Secret Location, Bushwick',
    guests: whorechataGuests,
  },
  {
    id: '3',
    name: 'Sustaining the Resistance',
    description: 'Community discussion & workshop on maintaining activist momentum in LGBTQ+ spaces with intergenerational healing circles',
    date: 'June 29, 2025',
    location: 'Interference Archive, Brooklyn',
    guests: resistanceWorkshopGuests,
  },
];

export default mockEvents;

// Mock Games Data
export const mockGames: Game[] = [
  {
    id: 'poll-1',
    title: 'Community Vibe Check',
    type: 'poll',
    description: 'How are we feeling tonight?',
    isActive: true,
    createdAt: new Date('2024-12-15T19:00:00'),
    eventId: 'event-1',
    staffId: 'staff-1',
    participants: ['guest-1', 'guest-2', 'guest-3'],
    settings: {
      allowOptOut: true,
      showResults: true,
      timeLimit: 60,
      contentWarning: undefined
    }
  } as Game,
  {
    id: 'trivia-1',
    title: 'LGBTQ+ History Trivia',
    type: 'trivia',
    description: 'Test your knowledge of queer history and culture',
    isActive: false,
    createdAt: new Date('2024-12-15T19:30:00'),
    eventId: 'event-1',
    staffId: 'staff-1',
    participants: [],
    settings: {
      allowOptOut: true,
      showResults: true,
      timeLimit: 30,
      contentWarning: undefined
    }
  } as Game,
  {
    id: 'icebreaker-1',
    title: 'Spicy Truth or Dare',
    type: 'icebreaker',
    description: 'Get to know each other with some spicy prompts',
    isActive: false,
    createdAt: new Date('2024-12-15T20:00:00'),
    eventId: 'event-1',
    staffId: 'staff-1',
    participants: [],
    settings: {
      allowOptOut: true,
      showResults: false,
      contentWarning: 'Contains adult themes and spicy content'
    }
  } as Game
];

export const mockPolls: Poll[] = [
  {
    id: 'poll-1',
    title: 'Community Vibe Check',
    type: 'poll',
    description: 'How are we feeling tonight?',
    isActive: true,
    createdAt: new Date('2024-12-15T19:00:00'),
    eventId: 'event-1',
    staffId: 'staff-1',
    participants: ['guest-1', 'guest-2', 'guest-3'],
    settings: {
      allowOptOut: true,
      showResults: true,
      timeLimit: 60
    },
    question: 'What\'s your energy level for tonight?',
    allowMultipleChoice: false,
    options: [
      { id: 'opt-1', text: '🔥 Ready to party!', votes: 12 },
      { id: 'opt-2', text: '😎 Chill and excited', votes: 8 },
      { id: 'opt-3', text: '🤗 Looking to connect', votes: 15 },
      { id: 'opt-4', text: '👀 Curious observer', votes: 5 }
    ]
  }
];

export const mockTriviaQuestions: TriviaQuestion[] = [
  {
    id: 'q1',
    question: 'Which year was the Stonewall Uprising?',
    options: ['1967', '1969', '1971', '1973'],
    correctAnswer: 1,
    explanation: 'The Stonewall Uprising occurred in June 1969, marking a turning point in the LGBTQ+ rights movement.'
  },
  {
    id: 'q2',
    question: 'What does the term "Two-Spirit" refer to?',
    options: [
      'A modern LGBTQ+ identity',
      'A traditional Indigenous gender identity',
      'A type of ceremony',
      'A social media platform'
    ],
    correctAnswer: 1,
    explanation: 'Two-Spirit is a traditional Indigenous gender identity that encompasses both masculine and feminine spirits.'
  },
  {
    id: 'q3',
    question: 'Who created the original Pride flag?',
    options: ['Gilbert Baker', 'Harvey Milk', 'Marsha P. Johnson', 'Sylvia Rivera'],
    correctAnswer: 0,
    explanation: 'Gilbert Baker designed the original rainbow Pride flag in 1978.'
  }
];

export const mockIcebreakerPrompts: IcebreakerPrompt[] = [
  {
    id: 'prompt-1',
    prompt: 'Share your most embarrassing crush story (PG-13 version)',
    category: 'spicy',
    responses: {}
  },
  {
    id: 'prompt-2',
    prompt: 'What\'s one thing you wish people knew about your identity?',
    category: 'deep',
    responses: {}
  },
  {
    id: 'prompt-3',
    prompt: 'If you could have dinner with any queer icon, who would it be?',
    category: 'fun',
    responses: {}
  },
  {
    id: 'prompt-4',
    prompt: 'What\'s your go-to karaoke song?',
    category: 'mild',
    responses: {}
  }
]; 