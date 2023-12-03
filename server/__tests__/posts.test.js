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
        expect(body.length).toBeGreaterThanOrEqual(1);
      });
  });
});

describe("GET '/posts/:id'", () => {
  test('Get without authentication should throw status 401', async () => {
    await request.agent(app).get(`/posts/${postId}`).expect(401);
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
