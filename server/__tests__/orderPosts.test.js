const app = require('../app');
const request = require('supertest');
const { query } = require('../database');
const { loggedUser } = require('./register.test');

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
      .get('/posts/following/liked')
      .expect(200)
      .then(res => {
        const body = JSON.parse(res.text);
        console.log(body);

        expect(body.posts.length).toBe(3);
        expect(body.posts[0].post_body).toBe(secondPost.rows[0].post_body);
        expect(body.posts[1].post_body).toBe(thirdPost.rows[0].post_body);
        expect(body.posts[2].post_body).toBe(firstPost.rows[0].post_body);
        body.posts.forEach(post =>
          expect(post.post_body).not.toBe(notFollowedPostBody)
        );
      });
  }, 20000);
});
