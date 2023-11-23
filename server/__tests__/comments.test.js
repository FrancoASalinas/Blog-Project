const app = require('../app');
const request = require('supertest');
const { query } = require('../database');
const { loggedUser } = require('./register.test');

let postId;
let commentId;
const comment = 'test comment';
const allCommentsUrl = () => `/posts/${postId}/comments`;
const commentUrl = () => allCommentsUrl() + `/${commentId}`;

test('Post without authentication should throw status 401', async () => {
  const user = await loggedUser();

  await user
    .post('/posts')
    .send({ content: 'askjdasd' })
    .expect(201)
    .then(async res => {
      const body = JSON.parse(res.text);
      expect(body.post_id).toBeDefined();

      postId = body.post_id;
    });

  await request(app)
    .post(allCommentsUrl())
    .send({ content: comment })
    .expect(401);
});

test('Post without content should throw status 400', async () => {
  const user = await loggedUser();

  await user.post(allCommentsUrl()).send({ content: undefined }).expect(400);
});

test("Post with content '' should throw status 400", async () => {
  const user = await loggedUser();

  await user.post(allCommentsUrl()).send({ content: '' }).expect(400);
});

test('Post Successfully should throw status 200', async () => {
  const user = await loggedUser();

  await user.post(allCommentsUrl()).send({ content: comment }).expect(200);
});

describe("GET 'posts/:id/comments/'", () => {
  test('Get without authentication should throw status 401', async () => {
    await request(app)
      .get(allCommentsUrl())
      .send({ content: comment })
      .expect(401);
  });

  test('Get should get all comments and throw status 200', async () => {
    const user = await loggedUser();

    await user
      .get(allCommentsUrl())
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);
        expect(body.length).toBeGreaterThan(0);

        commentId = body[0].comment_id;
      });
  });
  test('Get a nonexistent post should throw status 404', async () => {
    const user = await loggedUser();

    await user.get('/posts/4589/comments').expect(404);
  });
});

describe("PUT 'posts/:id/comments/:commentId'", () => {
  test('Put without authentication should throw status 401', async () => {
    await request(app).put(commentUrl()).send({ content: comment }).expect(401);
  });

  test('Put without being the author should throw status 403', async () => {
    const username = 'notadmin';

    await request(app)
      .post('/register')
      .send({
        username: username,
        password: username,
        confirm_password: username,
      })
      .expect(200);

    const user = request.agent(app);

    await user
      .post('/login')
      .send({ username: username, password: username })
      .expect(200);

    await user.put(commentUrl()).send({ content: comment }).expect(403);
  });

  test.todo('Put without sending content should throw status 400');

  test('Put should edit a comment', async () => {
    const editedContent = 'edited-test';
    let commentId;

    const user = await loggedUser();

    await user
      .post(allCommentsUrl())
      .send({ content: comment })
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);
        commentId = body.comment_id;
      });

    await user
      .put(allCommentsUrl() + `/${commentId}`)
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
    await request(app)
      .delete(commentUrl())
      .send({ content: comment })
      .expect(401);
  });

  test('Delete without being the comment author should throw status 403', async () => {
    const username = 'notadmin2';
    const user = request.agent(app);
    const otherUser = await loggedUser();
    let commentId;

    await query('DELETE FROM users WHERE user_name=$1', [username]);

    await user
      .post('/register')
      .send({
        username: username,
        password: username,
        confirm_password: username,
      })
      .expect(200);

    await user.post('/login').send({ username: username, password: username });

    await user
      .post(allCommentsUrl())
      .send({ content: 'test-content' })
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);
        commentId = body.comment_id;
      });

    await otherUser.delete(allCommentsUrl() + `/${commentId}`).expect(403);
  });

  test('Delete a nonexistent comment should throw status 404', async () => {
    const user = await loggedUser();

    await user.delete('/posts/300/comments/598').expect(404);
  });

  test('Delete should delete a comment and throw status 204', async () => {
    let commentId;
    const user = await loggedUser();

    await user
      .post(allCommentsUrl())
      .send({ content: comment })
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);
        commentId = body.comment_id;
      });

    await user.delete(allCommentsUrl() + `/${commentId}`).expect(204);
  });
});

describe("GET '/posts/:id/comments/:commentId'", () => {
  test('Get without authentication should throw status 401', async () => {
    await request(app).get(commentUrl()).expect(401);
  });

  test('Get should retrieve one comment and throw status 200', async () => {
    const user = await loggedUser();
    let commentId;

    await user
      .post(allCommentsUrl())
      .send({ content: comment })
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);
        commentId = body.comment_id;
      });

    await user
      .get(allCommentsUrl() + `/${commentId}`)
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);
        expect(body).toBeDefined();
      });

    await query('DELETE FROM comments WHERE comment_id=$1', [commentId]);
  });
  test('Get a nonexistent comment should throw status 404', async () => {
    const user = await loggedUser();

    await user.get(allCommentsUrl() + `/9287`).expect(404);
  });
});

describe('Comments likes', () => {
  let postId;
  let commentId;
  test('Post /posts/:id/comments/:commentId/likes should add a like to that comment', async () => {
    const user = await loggedUser();

    //Create post
    await user
      .post('/posts')
      .send({ content: 'test', author: 'admin' })
      .expect(201)
      .then(res => {
        const body = JSON.parse(res.text);

        postId = body.post_id;
      });

    //Add comment
    await user
      .post(`/posts/${postId}/comments`)
      .send({ content: 'test-comment' })
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);

        commentId = body.comment_id;
      });

    //Like a comment
    await user.post(`/posts/${postId}/comments/${commentId}/likes`).expect(204);
  });

  test('Get /posts/:id/comments/:commentId/likes should retrieve all likes', async () => {
    const user = await loggedUser();

    await user
      .get(`/posts/${postId}/comments/${commentId}/likes`)
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);
        expect(Number(body.count)).toBe(1);
      });
  });

  test('Post /posts/:id/comments/:commentId/likes should delete a like if it was liked already', async () => {
    const user = await loggedUser();

    //Dislike a post
    await user.post(`/posts/${postId}/comments/${commentId}/likes`).expect(204);

    //Ensure the post is disliked
    await user
      .get(`/posts/${postId}/comments/${commentId}/likes`)
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);
        expect(Number(body.count)).toBe(0);

        //Delete post
        query('DELETE FROM posts WHERE post_id=$1', [postId]);
      });
  });
});
