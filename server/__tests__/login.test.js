const app = require('../app');
const request = require('supertest');
const { query } = require('../database');
const {loggedUser} = require('./register.test')

describe("POST '/login'", () => {
    test("Login using credentials that aren't in database should throw status 400: 'Username or password are incorrect'", async () => {
      await request(app)
        .post('/login')
        .send({ username: 'lkefm', password: 'spoedfke3' })
        .expect(400)
        .then(response => {
          expect(response.body).toStrictEqual({
            errors: ['Username or password are incorrect'],
          });
        });
    });

    test("Login using wrong password should throw status 400: 'Username or password are incorrect'", async () => {
      await request(app)
        .post('/login')
        .send({
          username: 'admin123',
          password: 'admin123' + 'asdikolj',
        })
        .expect(400)
        .then(res => {
          expect(res.body).toStrictEqual({
            errors: ['Username or password are incorrect'],
          });
        });
    });

    test("Login without sending username or password should throw status 400: 'Username and password required'", async () => {
      await request(app)
        .post('/login')
        .send(' ')
        .expect(400)
        .then(res => {
          expect(res.body).toStrictEqual({
            errors: ['Username and password required'],
          });
        });
    });

    test('Login using credentials that are in the database should throw status 200', async () => {
      await loggedUser();
    });
  });
