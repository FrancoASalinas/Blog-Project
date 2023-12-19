const app = require('../app');
const request = require('supertest');
const { query } = require('../database');
const { loggedUser } = require('./register.test');
const encodedImage = require('./encodedImages')[0];
const encodedImageAlternative = require('./encodedImages')[1];

let postId;
let imagePostId;
let imageId;

afterAll(async () => {
  const user = await loggedUser();
  await user.delete(`/posts/${imagePostId}`).expect(204);
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
      .send({ content: testContent })
      .expect(201)
      .then(async res => {
        const body = JSON.parse(res.text);
        expect(body.post_body).toBe(testContent);

        postId = body.post_id;
      });
  });

  test('Post an image should store a reference in database', async () => {
    const user = await loggedUser();

    await user
      .post('/posts')
      .send({ content: 'this is an image', image: encodedImage })
      .expect(201)
      .then(async res => {
        const body = JSON.parse(res.text);
        imagePostId = body.post_id;

        const isImageId = await query(
          'SELECT post_imageid FROM posts WHERE post_id=$1',
          [body.post_id]
        ).then(query =>
          typeof query.rows[0].post_imageid === 'string' &&
          query.rows[0].post_imageid.length > 10
            ? true
            : false
        );

        expect(isImageId).toBe(true);
        expect(body.post_image).toBe(encodedImage);
      });
  });
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
        expect(body.posts.length).toBeGreaterThanOrEqual(1);
      });
  });
});

describe("GET '/posts/:id'", () => {
  test('Get without authentication should throw status 401', async () => {
    await request.agent(app).get(`/posts/${postId}`).expect(401);
  });

  test("If post doesn't exist it should throw status 404", async () => {
    const user = await loggedUser();

    await user.get('/posts/001').expect(404);
  });

  test("Get '/posts/1' should respond with a post", async () => {
    const user = await loggedUser();

    await user
      .get(`/posts/${postId}`)
      .expect(200)
      .then(res => {
        const { body } = res;

        expect(body.post_id).toBeTruthy();
      });
  });

  it('Should get a post with an image', async () => {
    const user = await loggedUser();

    await user
      .get(`/posts/${imagePostId}`)
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);
        expect(body.post_image).toBe(encodedImage);
        imageId = body.post_imageid;
      });
  });
});

describe("PUT 'posts/:id'", () => {
  const testContent = 'test-content';
  test('Put without authentication should throw status 401', async () => {
    await request
      .agent(app)
      .put('/posts/1')
      .send({ content: 'ksjgn' })
      .expect(401);
  });
  test('Put should update a post', async () => {
    const user = await loggedUser();

    await user
      .put(`/posts/${postId}`)
      .send({ content: testContent })
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);

        expect(body.post_body).toBe(testContent);
      });
  });

  test("If posts doesn't exist throw status 404", async () => {
    const user = await loggedUser();

    await user.put('/posts/001').send({ content: testContent }).expect(404);
  });

  test('Put a post with an image should update that image also', async () => {
    const user = await loggedUser();

    await user
      .put(`/posts/${imagePostId}`)
      .send({ content: testContent, image: encodedImageAlternative })
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);

        expect(body.post_imageid).toBeTruthy();
        expect(body.post_imageid.length).toBeGreaterThan(10);
        expect(body.post_body).toBe(testContent);
      });
  });
});

describe("DELETE 'posts/:id'", () => {
  test('Delete without authentication should throw status 401', async () => {
    await request.agent(app).delete('/posts/200').expect(401);
  });

  test('Delete should delete a post', async () => {
    const user = await loggedUser();

    await user.delete(`/posts/${postId}`).expect(204);
  });

  test("If post doesn't exist throw status 404", async () => {
    const user = await loggedUser();
    await user.delete('/posts/001').expect(404);
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

describe('Order followed user posts (principal page)', () => {
  it('Should return posts created by the users whose USER follows, ordered by likes', async () => {
    const postsUsername = 'postuser123';
    const likesUsername = 'likes1';
    const secondLikeUsername = 'likes2';
    const notFollowedUsername = 'notfollowed';

    //register posts user
    await request(app)
      .post('/register')
      .send({
        username: postsUsername,
        password: postsUsername,
        confirm_password: postsUsername,
      })
      .expect(200);

    //retrieve user id
    const postUserId = await query(
      'SELECT user_id FROM users WHERE user_name=$1',
      [postsUsername]
    );

    //register two other users
    await request(app).post('/register').send({
      username: likesUsername,
      password: likesUsername,
      confirm_password: likesUsername,
    });

    await request(app).post('/register').send({
      username: secondLikeUsername,
      password: secondLikeUsername,
      confirm_password: secondLikeUsername,
    });

    await request(app).post('/register').send({
      username: notFollowedUsername,
      password: notFollowedUsername,
      confirm_password: notFollowedUsername,
    });

    const likesUsernameId = await query(
      'SELECT user_id FROM users WHERE user_name=$1',
      [likesUsername]
    );

    const secondLikeUsernameId = await query(
      'SELECT user_id FROM users WHERE user_name=$1',
      [secondLikeUsername]
    );

    const notFollowedUsernameId = await query(
      'SELECT user_id FROM users WHERE user_name=$1',
      [notFollowedUsername]
    ).then(query => query.rows[0].user_id);

    //login with admin user
    const user = await loggedUser();

    //follow posts user
    await user
      .post(`/users/${postUserId.rows[0].user_id}/followers`)
      .expect(200);

    //make three posts with that user
    const firstPost = await query(
      'INSERT INTO posts(post_author, post_body) VALUES($1, $2) RETURNING *',
      [postUserId.rows[0].user_id, 'abcd']
    );

    const secondPost = await query(
      'INSERT INTO posts(post_author, post_body) VALUES($1, $2) RETURNING *',
      [postUserId.rows[0].user_id, 'blabla']
    );

    const thirdPost = await query(
      'INSERT INTO posts(post_author, post_body) VALUES($1, $2) RETURNING *',
      [postUserId.rows[0].user_id, 'givemelikes']
    );

    //make a post with a user not followed
    const notFollowedPostBody = await query(
      'INSERT INTO posts(post_author, post_body) VALUES($1, $2) RETURNING *',
      [notFollowedUsernameId, 'oh no']
    ).then(query => query.rows[0].post_body);

    //like the three posts differently
    await query('INSERT INTO post_likes(post_id, user_id) VALUES($1, $2)', [
      secondPost.rows[0].post_id,
      postUserId.rows[0].user_id,
    ]);
    await query('INSERT INTO post_likes(post_id, user_id) VALUES($1, $2)', [
      secondPost.rows[0].post_id,
      likesUsernameId.rows[0].user_id,
    ]);
    await query('INSERT INTO post_likes(post_id, user_id) VALUES($1, $2)', [
      secondPost.rows[0].post_id,
      secondLikeUsernameId.rows[0].user_id,
    ]);

    await query('INSERT INTO post_likes(post_id, user_id) VALUES($1, $2)', [
      thirdPost.rows[0].post_id,
      postUserId.rows[0].user_id,
    ]);
    await query('INSERT INTO post_likes(post_id, user_id) VALUES($1, $2)', [
      thirdPost.rows[0].post_id,
      likesUsernameId.rows[0].user_id,
    ]);

    await query('INSERT INTO post_likes(post_id, user_id) VALUES($1, $2)', [
      firstPost.rows[0].post_id,
      postUserId.rows[0].user_id,
    ]);

    await user
      .get('/posts?order=likes')
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);

        expect(body.posts[0].post_body).toBe(secondPost.rows[0].post_body);
        expect(body.posts[1].post_body).toBe(thirdPost.rows[0].post_body);
        expect(body.posts[2].post_body).toBe(firstPost.rows[0].post_body);
        body.posts.forEach(post =>
          expect(post.post_body).not.toBe(notFollowedPostBody)
        );
      });
  }, 20000);
});

describe('GET /posts should always return the posts created by user', () => {
  let postId;

  beforeAll(async () => {
    const user = await loggedUser();

    //create post
    await user
      .post('/posts')
      .send({ content: 'new post' })
      .expect(201)
      .then(res => {
        const body = JSON.parse(res.text);
        postId = body.post_id;
      });
  });

  test('GET /posts', async () => {
    const user = await loggedUser();

    //get all posts
    await user
      .get('/posts')
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);
        expect(body.posts).toEqual(
          expect.arrayContaining([expect.objectContaining({ post_id: postId })])
        );
      });
    });

    test('GET /posts?order=likes', async () => {
      const user = await loggedUser();

      await user
        .get('/posts?order=likes')
        .expect(200)
        .then(res => {
          const body = JSON.parse(res.text);
          console.log(postId);
          console.log(body)
          expect(body.posts).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ post_id: postId }),
            ])
          );
        });
    });
});
