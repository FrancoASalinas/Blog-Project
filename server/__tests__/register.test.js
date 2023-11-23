const app = require('../app');
const request = require('supertest');
const { query } = require('../database');

const loggedUserName = 'admin123';
const loggedUserPass = 'admin123';

async function loggedUser(username) {
  const user = request.agent(app);
  await user
    .post('/login')
    .send({ username: loggedUserName, password: loggedUserPass })
    .expect(200);

  return user;
}

describe('Register', () => {
  test.each([
    [
      ' ',
      ' ',
      ' ',
      {
        errors: {
          username: ['Input must be larger than 4 characters'],
          password: ['Input must be larger than 6 characters'],
        },
      },
    ],
    [
      '     ',
      '       ',
      '  ',
      {
        errors: {
          username: ['Input must be larger than 4 characters'],
          password: ['Input must be larger than 6 characters'],
        },
      },
    ],
    [
      'abc',
      'abcd',
      ' ',
      {
        errors: {
          username: ['Input must be larger than 4 characters'],
          password: ['Input must be larger than 6 characters'],
          confirm_password: ['Passwords are not equal'],
        },
      },
    ],
    [
      'abcde',
      'abcdefg',
      'abcdef',
      { errors: { confirm_password: ['Passwords are not equal'] } },
    ],
    [
      'abcdefasdfgrasdds',
      'asdasdasdasdasdasdasa',
      'asdasdasdasdasdasdasa',
      {
        errors: {
          username: ['Input must be shorter than 16 characters'],
          password: ['Input must be shorter than 20 characters'],
        },
      },
    ],
    [
      'asd asd e',
      'akdi o',
      'akdi o',
      {
        errors: {
          username: ['Input has invalid characters'],
          password: ['Input has invalid characters'],
        },
      },
    ],
    [
      '_____',
      '_______',
      '_______',
      {
        errors: {
          username: ['Input has invalid characters'],
          password: ['Input has invalid characters'],
        },
      },
    ],
    [
      '.franco',
      'franco.',
      'franco.',
      {
        errors: {
          username: ['Input has invalid characters'],
          password: ['Input has invalid characters'],
        },
      },
    ],
    [
      '-----',
      '-------',
      '-------',
      {
        errors: {
          username: ['Input has invalid characters'],
          password: ['Input has invalid characters'],
        },
      },
    ],
  ])(
    'username: %s, password: %s and confirm password: %s should throw status 400 and response: %o',
    async (username, password, confirmPassword, response) => {
      await request
        .agent(app)
        .post('/register')
        .send({
          username: username,
          password: password,
          confirm_password: confirmPassword,
        })
        .expect(400)
        .then(res => {
          const body = res.body;
          expect(body.errors.username).toStrictEqual(response.errors.username);
          expect(body.errors.password).toStrictEqual(response.errors.password);
          expect(body.errors.confirm_password).toStrictEqual(
            response.errors.confirm_password
          );
        });
    }
  );
  test('Register should throw status 200', async () => {
    await query('DELETE FROM users WHERE user_name=$1', [loggedUserName]);

    await request(app)
      .post('/register')
      .send({
        username: loggedUserName,
        password: loggedUserPass,
        confirm_password: loggedUserPass,
      })
      .expect(200);
  }, 10000);

  test('Register using already taken username should throw status 409', async () => {
    await request(app)
      .post('/register')
      .send({
        username: loggedUserName,
        password: loggedUserPass,
        confirm_password: loggedUserPass,
      })
      .expect(409);
  });
});

module.exports = { loggedUser, loggedUserName, loggedUserPass };
