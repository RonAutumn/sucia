export interface Guest {
  id: string;
  name: string;
  email: string;
  checkedIn: boolean;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  guestList: Guest[];
} 