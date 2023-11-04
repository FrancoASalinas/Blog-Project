import { screen } from '@testing-library/react';
import { setup } from './router.test';

describe('Register page', () => {
  it('should show username label', async () => {
    setup('/register');

    expect(screen.getByLabelText(/username/i)).toBeTruthy();
  });
  it('should show password label', async () => {
    setup('/register');

    expect(screen.getByLabelText(/password/i));
  });
  it('should show confirm password label', async () => {
    setup('/register');

    expect(screen.getByLabelText(/confirm password/i));
  });

  describe('Username Input', () => {
    test.each([
      ['abc', /input must be longer than 4 characters/i, true],
      ['abcderfgthngfrthg', /input must be shorter than 16 characters/i, true],
      ['abcderfgthngfrth', /input must be shorter than 16 characters/i, false],
      ['abcd', /Input must be longer than 4 characters/i, false],
      ['/&·$)(', /input has invalid characters/i, true],
      ['  ', /Input must be longer than 4 characters/i, false],
      ['   abc', /Input must be longer than 4 characters/i, true],
      ['      ', /input has invalid characters/i, false],
    ])(
      "Username input %s should show %s? %s, shouldn't show the alert if the input is empty",
      async (string, alert, shouldAlert) => {
        const { user } = setup('/register');
        const usernameInput = screen.getByLabelText(/username/i);

        expect(screen.queryByText(alert)).toBeNull();

        await user.type(usernameInput, string);

        if (shouldAlert) {
          expect(screen.getByText(alert)).toBeTruthy();
        } else {
          expect(screen.queryByText(alert)).toBeNull();
        }
      }
    );
  });

  describe('Password Input', () => {
    test.each([
      ['abc', /input must be longer than 6 characters/i, true],
      ['abcderfgthngfrthgasad', /input must be shorter than 20 characters/i, true],
      ['abcderfgthngfrthsawd', /input must be shorter than 20 characters/i, false],
      ['abcdef', /Input must be longer than 6 characters/i, false],
      ['/&·$)(', /input has invalid characters/i, true],
      ['  ', /Input must be longer than 6 characters/i, false],
      ['   abc', /Input must be longer than 6 characters/i, true],
      ['      ', /input has invalid characters/i, false],
    ])(
      "Password input %s should show %s? %s, shouldn't show the alert if the input is empty",
      async (string, alert, shouldAlert) => {
        const { user } = setup('/register');
        const passwordInput = screen.getByLabelText(/password/i);

        expect(screen.queryByText(alert)).toBeNull();

        await user.type(passwordInput, string);

        if (shouldAlert) {
          expect(screen.getByText(alert)).toBeTruthy();
        } else {
          expect(screen.queryByText(alert)).toBeNull();
        }
      }
    );
  });
});
