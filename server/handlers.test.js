const app = require('./app');
const request = require('supertest');
const { query } = require('./database');

jest.useFakeTimers();

describe('Handlers', () => {
  describe('Register', () => {
    test('Register should throw status 200', async () => {
      const username = 'admin';
      await query('DELETE FROM users WHERE user_name=$1', [username]);

      await request(app)
        .post('/register')
        .send({ username: username, password: 'admin' })
        .expect(200);
    });

    test('Register using already taken username should throw status 409', async () => {
      const username = 'admin';
      await request(app)
        .post('/register')
        .send({ username: username, password: 'admin' })
        .expect(409);
    });
  });

  describe("POST '/login'", () => {
    test("Login using credentials that aren't in database should throw status 400: 'Username or password are incorrect'", async () => {
      await request(app)
        .post('/login')
        .send({ username: 'lkefm', password: 'spoedfke3' })
        .expect(400)
        .then(response => {
          expect(response.text).toBe('Username or password are incorrect');
        });
    });

    test("Login without sending username or password should throw status 400: 'Username and password required'", async () => {
      await request(app)
        .post('/login')
        .send('')
        .expect(400)
        .then(res => {
          expect(res.text).toBe('Username and password required');
        });
    });

    test("Login using credentials that are in the database ('admin', 'admin') should throw status 200", async () => {
      const user = request.agent(app);

      user
        .post('/login')
        .send({ username: 'admin', password: 'admin' })
        .expect(200);
    });

    describe("GET '/posts'", () => {
      test('Get without authentication should throw status 401', async () => {
        await request(app).get('/posts').expect(401);
      });

      test('Get all posts', async () => {
        const user = request.agent(app);

        await user
          .post('/login')
          .send({ username: 'admin', password: 'admin' })
          .expect(200);

        user
          .get('/posts')
          .expect(200)
          .then(res => {
            const { body } = res;
            expect(body.length).toBeGreaterThanOrEqual(1);
          });
      });
    });

    describe("GET '/posts/:id'", () => {
      test('Get without authentication should throw status 401', async () => {
        await request.agent(app).get('/posts/1').expect(401);
      });

      test("Get '/posts/1' should respond with a post", async () => {
        const user = request.agent(app);

        await user
          .post('/login')
          .send({ username: 'admin', password: 'admin' })
          .expect(200);

        user
          .get('/posts/1')
          .expect(200)
          .then(res => {
            const { body } = res;

            expect(body.post_id).toBeTruthy();
          });
      });
    });

    describe("POST '/posts'", () => {
      test('Post without authentication should throw status 401', async () => {
        await request.agent(app).post('/posts').expect(401);
      });

      test('Post should return the inserted post', async () => {
        const user = request.agent(app);
        const username = 'admin';
        const testContent = 'test content';

        await user
          .post('/login')
          .send({ username: 'admin', password: 'admin' })
          .expect(200);

        user
          .post('/posts')
          .send({ content: testContent, author: username })
          .expect(201)
          .then(res => {
            const body = JSON.parse(res.text);
            expect(body.post_body).toBe(testContent);
            expect(body.post_author).toBe(username);

            query('DELETE FROM posts WHERE post_body=$1 AND post_author=$2', [
              testContent,
              username,
            ]);
          });
      });
    });

    describe("PUT 'posts/:id'", () => {
      test('Put without authentication should throw status 401', async () => {
        request
          .agent(app)
          .put('/posts/1')
          .send({ content: 'ksjgn' })
          .expect(401);
      });
      test('Put should update a post', async () => {
        const user = request.agent(app);

        const username = 'admin';
        const testContent = 'test-content';

        await user
          .post('/login')
          .send({ username: 'admin', password: 'admin' })
          .expect(200);

        user
          .put('/posts/1')
          .send({ content: testContent, author: username })
          .expect(200)
          .then(res => {
            const body = JSON.parse(res.text);

            expect(body.post_body).toBe(testContent);
          });
      });
    });

    describe("DELETE 'posts/:id'", () => {
      test('Delete without authentication should throw status 401', async () => {
        await request.agent(app).delete('/posts/200').expect(401);
      });

      test('Delete should delete a post', async () => {
        const post_id = 200;
        const post_content = 'content content';
        const post_author = 'asdkj';

        const { rowCount } = await query(
          'SELECT * FROM posts WHERE post_id=$1',
          [post_id]
        );
        if (rowCount === 0) {
          await query(
            'INSERT INTO posts(post_id, post_author, post_body) VALUES($1, $2, $3)',
            [post_id, post_author, post_content]
          );
        }

        const user = request.agent(app);

        await user
          .post('/login')
          .send({ username: 'admin', password: 'admin' })
          .expect(200);

        user
          .delete(`/posts/${post_id}`)
          .expect(204)
          .then(() => {
            query(
              'INSERT INTO posts(post_id, post_body, post_author) VALUES($1, $2, $3)',
              [post_id, post_content, post_author]
            );
          });
      });
    });
  });
});
