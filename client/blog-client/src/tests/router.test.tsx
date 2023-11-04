import { MemoryRouter, Routes } from 'react-router-dom';
import { routes } from '../utils/routes';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export const setup = (entries: string | string[], index?: number) => {
  const user = userEvent.setup();

  return{
  user: user,
  ...render(
    <MemoryRouter
      initialEntries={typeof entries === 'string' ? [entries] : entries}
      initialIndex={index}
    >
      <Routes>{routes}</Routes>
    </MemoryRouter>
  ),
}};
describe('routes', () => {

  describe('Homepage', () => {
    test("'/' renders homepage and header", () => {
      setup('/');

      expect(screen.getByText(/sayit/i)).toBeTruthy();
      expect(screen.getByAltText('logo')).toBeTruthy();
    });

    test("Click on Register button should navigate to '/register'", async () => {
      const { user } = setup('/');

      await user.click(screen.getByText(/register/i));

      expect(screen.getByLabelText(/username/i)).toBeTruthy();
      expect(screen.getByLabelText(/password/i)).toBeTruthy();
    });
  });
});
