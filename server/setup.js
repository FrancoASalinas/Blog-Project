const request = require('supertest');
const { query } = require('./database');
const app = require('./app');

module.exports = async () => {
  //clear database
  await query('DELETE FROM users');
  await query('DELETE FROM posts');

  console.log('cleared users and posts from database');

  //create user
  await request(app).post('/register').send({
    username: 'admin123',
    password: 'admin123',
    confirm_password: 'admin123',
  });

  console.log('registered new user');
};
