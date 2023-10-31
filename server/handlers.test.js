const app = require('./app');
const request = require('supertest');
const { query } = require('./database');

jest.useFakeTimers();

const loggedUserName = 'admin';
const loggedUserPass = 'admin';

async function loggedUser() {
  const user = request.agent(app);
  await user
    .post('/login')
    .send({ username: loggedUserName, password: loggedUserPass })
    .expect(200);

  return user;
}
describe('Handlers', () => {
  describe('Register', () => {
    test('Register should throw status 200', async () => {
      await query('DELETE FROM users WHERE user_name=$1', [loggedUserName]);

      await request(app)
        .post('/register')
        .send({ username: loggedUserName, password: loggedUserPass })
        .expect(200);
    }, 10000);

    test('Register using already taken username should throw status 409', async () => {
      await request(app)
        .post('/register')
        .send({ username: loggedUserName, password: loggedUserPass })
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

    test('Login using credentials that are in the database should throw status 200', async () => {
      await loggedUser();
    });

    describe("GET '/posts'", () => {
      test('Get without authentication should throw status 401', async () => {
        await request(app).get('/posts').expect(401);
      });

      it('Should get all posts', async () => {
        const user = await loggedUser();

        await user
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
        const user = await loggedUser();

        await user
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
        const testContent = 'test content';

        const user = await loggedUser();

        await user
          .post('/posts')
          .send({ content: testContent, author: loggedUserName })
          .expect(201)
          .then(res => {
            const body = JSON.parse(res.text);
            expect(body.post_body).toBe(testContent);
            expect(body.post_author).toBe(loggedUserName);

            query('DELETE FROM posts WHERE post_body=$1 AND post_author=$2', [
              testContent,
              loggedUserName,
            ]);
            return;
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
        const testContent = 'test-content';

        const user = await loggedUser();

        await user
          .put('/posts/1')
          .send({ content: testContent, author: loggedUserName })
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

        const user = await loggedUser();

        await user
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

  describe('Comments', () => {
    const post = 200;
    const comment = 'test comment';
    const allCommentsUrl = `/posts/${post}/comments`;
    const commentUrl = allCommentsUrl + '/1';

    describe("POST 'posts/:id/comments'", () => {
      test('Post without authentication should throw status 401', () => {
        request(app)
          .post(allCommentsUrl)
          .send({ content: comment })
          .expect(401);
      });

      test('Post without content should throw status 400', async () => {
        const user = await loggedUser();

        await user
          .post(allCommentsUrl)
          .send({ content: undefined })
          .expect(400);
      });

      test("Post with content '' should throw status 400", async () => {
        const user = await loggedUser();

        await user.post(allCommentsUrl).send({ content: '' }).expect(400);
      });

      test('Post Successfully should throw status 200', async () => {
        const user = await loggedUser();

        await user
          .post('/posts/200/comments')
          .send({ content: comment })
          .expect(200)
          .then(res => {
            const body = JSON.parse(res.text);
            expect(body.comment_id).toBeDefined();
            query('DELETE FROM comments');
          });
      });
    });

    describe("PUT 'posts/:id/comments/:commentId'", () => {
      test('Put without authentication should throw status 401', () => {
        request(app).put(commentUrl).send({ content: comment }).expect(401);
      });

      test('Put without being the author should throw status 403', async () => {
        const username = 'notadmin';

        await query('DELETE FROM users WHERE user_name=$1', [username]);

        await request(app)
          .post('/register')
          .send({ username: username, password: username })
          .expect(200);

        const user = await loggedUser();

        await user.put(commentUrl).send({ content: comment }).expect(403);
      });

      test.todo('Put without sending content should throw status 400');

      test('Put should edit a comment', async () => {
        const editedContent = 'edited-test';
        let commentId;

        const user = await loggedUser();

        await user
          .post(allCommentsUrl)
          .send({ content: comment })
          .expect(200)
          .then(res => {
            const body = JSON.parse(res.text);
            commentId = body.comment_id;
          });

        await user
          .put(allCommentsUrl + `/${commentId}`)
          .send({ content: editedContent })
          .expect(200)
          .then(res => {
            const body = JSON.parse(res.text);
            expect(body.comment_body).toBe(editedContent);
            query('DELETE FROM comments');
          });
      });
    });

    describe("DELETE 'posts/:id/comments/:commentId'", () => {
      test('Delete without authentication should throw status 401', async () => {
        request(app).delete(commentUrl).send({ content: comment }).expect(401);
      });

      test('Delete without being the comment author should throw status 403', async () => {
        const username = 'notadmin';
        const user = request.agent(app);
        const otherUser = await loggedUser();
        let commentId;

        await query('DELETE FROM users WHERE user_name=$1', [username]);

        await user
          .post('/register')
          .send({ username: username, password: username })
          .expect(200);

        await user
          .post('/login')
          .send({ username: 'notadmin', password: 'notadmin' });

        await user
          .post(allCommentsUrl)
          .send({ content: 'test-content' })
          .expect(200)
          .then(res => {
            const body = JSON.parse(res.text);
            commentId = body.comment_id;
          });

        await otherUser.delete(allCommentsUrl + `/${commentId}`).expect(403);
      });

      test('Delete a nonexistent comment should throw status 404', async () => {
        const user = await loggedUser();

        await user.delete('/posts/300/comments/598').expect(404);
      });

      test('Delete should delete a comment and throw status 204', async () => {
        let commentId;
        const user = await loggedUser();

        await user
          .post(allCommentsUrl)
          .send({ content: comment })
          .expect(200)
          .then(res => {
            const body = JSON.parse(res.text);
            commentId = body.comment_id;
          });

        await user.delete(allCommentsUrl + `/${commentId}`).expect(204);
      });
    });

    describe("GET 'posts/:id/comments/'", () => {
      test('Get without authentication should throw status 401', async () => {
        request(app).get(allCommentsUrl).send({ content: comment }).expect(401);
      });

      test('Get should get all comments and throw status 200', async () => {
        const user = await loggedUser();

        await user
          .get(allCommentsUrl)
          .expect(200)
          .then(res => {
            const body = JSON.parse(res.text);
            expect(body.length).toBeGreaterThan(0);
          });
      });
      test('Get a nonexistent post should throw status 404', async () => {
        const user = await loggedUser();

        await user.get('/posts/4589/comments').expect(404);
      });
    });

    describe("GET '/posts/:id/comments/:commentId'", () => {
      test('Get without authentication should throw status 401', async () => {
        await request(app).get(commentUrl).expect(401);
      });

      test('Get should retrieve one comment and throw status 200', async () => {
        const user = await loggedUser();
        let commentId;

        await user
          .post(allCommentsUrl)
          .send({ content: comment })
          .expect(200)
          .then(res => {
            const body = JSON.parse(res.text);
            commentId = body.comment_id;
          });

        await user
          .get(allCommentsUrl + `/${commentId}`)
          .expect(200)
          .then(res => {
            const body = JSON.parse(res.text);
            expect(body).toBeDefined();
          });

        await query('DELETE FROM comments WHERE comment_id=$1', [commentId]);
      });
      test('Get a nonexistent comment should throw status 404', async () => {
        const user = await loggedUser();

        await user.get(allCommentsUrl + `/9287`).expect(404);
      });
    });
  });

  describe("Post's Likes", () => {
    let postId;
    test('POST /posts/:id/likes should add a like and throw status 204', async () => {
      const user = await loggedUser();

      //Create a post and retrieve post id
      await user
        .post('/posts')
        .send({ content: 'test-content', author: 'admin' })
        .expect(201)
        .then(res => {
          const body = JSON.parse(res.text);
          postId = body.post_id;
        });

      //Like the post using post id
      await user.post(`/posts/${postId}/likes`).expect(204);
    });

    test('Get /posts/:id/likes should retrieve that post likes count', async () => {
      const user = await loggedUser();

      await user
        .get(`/posts/${postId}/likes`)
        .expect(200)
        .then(res => {
          const body = JSON.parse(res.text);

          expect(Number(body.count)).toBe(1);
        });
    });

    test('POST /posts/:id/likes should delete a like if it was already liked', async () => {
      const user = await loggedUser();

      await user.post(`/posts/${postId}/likes`).expect(204);

      await user
        .get(`/posts/${postId}`)
        .expect(200)
        .then(async res => {
          await query('DELETE FROM posts WHERE post_id=$1', [postId]);
        });
    });

    
  });
});
