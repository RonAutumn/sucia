import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventPicker from './components/EventPicker';

test('renders the app with event picker', () => {
  render(
    <MemoryRouter>
      <EventPicker />
    </MemoryRouter>
  );
  const element = screen.getByText(/Select an Event/i);
  expect(element).toBeInTheDocument();
}); 