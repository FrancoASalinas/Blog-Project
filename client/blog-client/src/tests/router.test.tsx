import { MemoryRouter, Routes } from 'react-router-dom';
import React from 'react';
import { routes } from '../utils/routes';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('routes', () => {
  const setup = (entries: string | string[], index?: number) => ({
    user: userEvent.setup(),
    ...render(
      <MemoryRouter
        initialEntries={typeof entries === 'string' ? [entries] : entries}
        initialIndex={index}
      >
        <Routes>{routes}</Routes>
      </MemoryRouter>
    ),
  });

  test("'/' renders homepage and header", () => {
    const user = setup('/');

    expect(screen.getByText(/sayit/i)).toBeTruthy();
    expect(screen.getByAltText('logo')).toBeTruthy();
  });
});
