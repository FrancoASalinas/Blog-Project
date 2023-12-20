const { query } = require('./database');
const fs = require('fs/promises');
const { Buffer } = require('buffer');
const crypto = require('crypto');
const {
  hashPassword,
  compareHash,
  validatePassword,
  validateUsername,
  passwordIsConfirmed,
  isUserExist,
} = require('./utils/index');

const loginHandler = async (req, res) => {
  const { username, password } = req.body;

  if (username && password) {
    const { rows } = await query('SELECT * FROM users WHERE user_name=$1', [
      username,
    ]);

    if (rows.length > 0) {
      const hash = rows[0].user_hash;

      compareHash(password, hash, (err, isSame) => {
        if (err) {
          console.log(err);
          res.status(500);
          res.end();
        } else {
          if (isSame) {
            req.session.userId = rows[0].user_id;
            res.status(200);
            res.end();
          } else {
            res.type('application/json');
            res
              .status(400)
              .send({ errors: ['Username or password are incorrect'] });
          }
        }
      });
    } else {
      res.type('application/json');
      res.status(400).send({ errors: ['Username or password are incorrect'] });
    }
  } else {
    res.type('application/json');
    res.status(400).send({ errors: ['Username and password required'] });
  }
};

const registerHandler = async (req, res) => {
  const { username, password, confirm_password } = await req.body;

  if (username && password && confirm_password) {
    const errors = {};
    const usernameErrors = validateUsername(username);
    const passwordErrors = validatePassword(password);
    const confirmPasswordError = passwordIsConfirmed(
      password,
      confirm_password
    );

    //validate username
    if (usernameErrors) {
      errors.username = usernameErrors;
    }

    //validate password
    if (passwordErrors) {
      errors.password = passwordErrors;
    }

    //validate confirm_password
    if (confirmPasswordError) {
      errors.confirm_password = confirmPasswordError;
    }

    if (Object.keys(errors).length > 0) {
      res.status(400);
      res.type('application/json');
      res.send(JSON.stringify({ errors: errors }));
    }

    const takenUsername = await query(
      'SELECT * FROM users WHERE user_name=$1',
      [username]
    );

    if (takenUsername.rowCount !== 0) {
      res.status(409);
      res.end();
    }

    hashPassword(password, async (err, hash, salt) => {
      if (err) {
        console.log(err);
        res.status(500);
      }

      const insertUser = await query(
        'INSERT INTO users(user_name, user_hash, user_salt) VALUES($1, $2, $3) RETURNING *',
        [username, hash, salt]
      );

      if (insertUser.rowCount > 0) {
        res.status(200);
        res.end();
      }
    });
  } else {
    res.status(400);
    res.end();
  }
};

const allPostsHandler = async (req, res) => {
  const userId = req.session.userId;
  const queryParams = req.query;

  async function addPostsImages(posts) {
    for (let post of posts) {
      if (post.post_imageid) {
        const image = await fs.readFile(`./images/${post.post_imageid}.jpg`, {
          encoding: 'base64',
        });

        post.post_image = 'data:image/png;base64,' + image;
      }
    }
  }

  if (queryParams.order === 'likes') {
    const followingPostsByLikes = await query(
      'SELECT p.post_id FROM posts p INNER JOIN post_likes l ON p.post_id=l.post_id WHERE post_author = ANY(SELECT user_id FROM followers WHERE follower_id=$1)',
      [userId]
    )
      .then(async queryResult =>
        query(
          'SELECT p.*, post_likes, u.user_name, EXISTS(SELECT * FROM post_likes l WHERE l.post_id=p.post_id AND l.user_id=$1 ) as is_liked FROM posts p INNER JOIN users u ON p.post_author=u.user_id, LATERAL (SELECT CAST (COUNT(*) AS INTEGER) as post_likes FROM post_likes k WHERE post_id=p.post_id) WHERE post_id = ANY($2) ORDER BY post_likes DESC LIMIT 10',
          [userId, queryResult.rows.map(entry => (entry = entry.post_id))]
        )
      )
      .then(queryResult => queryResult.rows);

    const notLikedUserPosts = await query(
      'SELECT p.*, l.*, u.user_name, EXISTS(SELECT FROM post_likes l WHERE l.post_id=p.post_id AND l.user_id=$1) as is_liked FROM posts p FULL OUTER JOIN post_likes l ON p.post_id=l.post_id INNER JOIN users u ON p.post_author=u.user_id WHERE l.user_id IS NULL AND post_author=$1',
      [userId]
    ).then(query => query.rows);

    const posts = [...followingPostsByLikes, ...notLikedUserPosts];

    await addPostsImages(posts);

    res.status(200);
    res.end(
      JSON.stringify({
        posts: [...followingPostsByLikes, ...notLikedUserPosts],
      })
    );
  } else {
    const { rows } = await query(
      'SELECT p.*, u.user_name, EXISTS(SELECT FROM post_likes l WHERE p.post_id=l.post_id AND l.user_id=$1) as is_liked FROM posts p INNER JOIN users u ON p.post_author=u.user_id',
      [userId]
    );

    await addPostsImages(rows);
    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify({ posts: rows }));
  }
};

const postHandler = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.session;
  const { rows } = await query(
    'SELECT p.*, u.user_name, EXISTS(SELECT FROM post_likes l WHERE l.post_id=p.post_id AND l.user_id=$1) as is_liked FROM posts p INNER JOIN users u ON p.post_author=u.user_id WHERE post_id=$2',
    [userId, id]
  );
  const post = rows.length === 1;

  if (post) {
    if (rows[0].post_imageid) {
      const image = await fs.readFile(`./images/${rows[0].post_imageid}.jpg`, {
        encoding: 'base64',
      });
      rows[0].post_image = image;
    }
    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify(rows[0]));
  } else {
    res.writeHead(404, { 'Content-type': 'text/plain' });
    res.end('Post not found or id invalid');
  }
};

const createPostHandler = async (req, res) => {
  const { content, image } = req.body;
  const userId = req.session.userId;

  if (content) {
    if (image) {
      async function generateImageId() {
        const uuid = crypto.randomUUID();
        const isIdTaken = async () => {
          await query('SELECT * FROM posts WHERE post_imageid=$1', [uuid]).then(
            query => (query.rowCount > 0 ? true : false)
          );
        };
        if (await isIdTaken()) {
          return generateImageId();
        }
        return uuid;
      }

      const imageId = await generateImageId();

      const imageBuffer = Buffer.from(image, 'base64');

      try {
        await fs.mkdir('./images', { recursive: true }).then(async () => {
          await fs.writeFile(`./images/${imageId}.jpg`, imageBuffer);
        });

        const { rows } = await query(
          'INSERT INTO posts(post_author, post_body, post_imageid) VALUES($1, $2, $3) RETURNING *',
          [userId, content, imageId]
        );

        const postData = {
          ...rows[0],
          post_image: image,
        };

        res.type('application/json');
        res.status(201);
        res.end(JSON.stringify(postData));
      } catch (err) {
        console.log(err);
      }
    } else {
      const { rows } = await query(
        'INSERT INTO posts(post_author, post_body) VALUES($1, $2) RETURNING *',
        [userId, content]
      );

      res.type('application/json');
      res.status(201);
      res.end(JSON.stringify(rows[0]));
    }
  } else {
    res.writeHead(400, 'Bad Request');
    res.end('There is an error on the request syntax');
  }
};

const updatePostHandler = async (req, res) => {
  const { body } = req;
  if (body.content || body.image) {
    const { id } = req.params;

    const doesPostExist = await query('SELECT * FROM posts WHERE post_id=$1', [
      id,
    ]).then(query => (query.rowCount > 0 ? true : false));

    if (doesPostExist) {
      const { rows } = await query(
        'UPDATE posts SET post_body=$1 WHERE post_id=$2 RETURNING *',
        [body.content, id]
      );

      if (body.image) {
        const doesPostImage = await query(
          'SELECT * FROM posts WHERE post_id=$1',
          [id]
        ).then(res =>
          res.rows[0].post_imageid
            ? { does: true, imageId: res.rows[0].post_imageid }
            : { does: false }
        );
        if (doesPostImage.does) {
          const imageBuffer = Buffer.from(body.image, 'base64');
          await fs.writeFile(
            `./images/${doesPostImage.imageId}.jpg`,
            imageBuffer
          );
          const image = await fs.readFile(
            `./images/${doesPostImage.imageId}.jpg`,
            {
              encoding: 'base64',
            }
          );

          rows[0].post_image = image;
        }
      }

      res.status(200).send(JSON.stringify(rows[0]));
    } else {
      res.status(404);
      res.end();
    }
  } else {
    res.status(400).send('There is an error on the request syntax');
  }
};

const deletePostHandler = async (req, res) => {
  const { id } = req.params;

  const doesPostExist = await query('SELECT FROM posts WHERE post_id=$1', [
    id,
  ]).then(query => (query.rowCount > 0 ? true : false));

  if (doesPostExist) {
    const doesHaveImage = await query('SELECT * FROM posts WHERE post_id=$1', [
      id,
    ]).then(query =>
      query.rows[0].post_imageid
        ? { does: true, imageId: query.rows[0].post_imageid }
        : { does: false }
    );

    if (doesHaveImage.does) {
      await fs.rm(`./images/${doesHaveImage.imageId}.jpg`);
    }

    await query('DELETE FROM posts WHERE post_id=$1', [id]);

    res.status(204);
    res.end();
  } else {
    res.status(404);
    res.end();
  }
};

const addComment = async (req, res) => {
  const postId = req.params.id;
  const commentary = req.body.content;
  const userId = req.session.userId;

  if (commentary && commentary.length > 0 && postId && userId) {
    const { rows, rowCount } = await query(
      'INSERT INTO comments(comment_body, post_id, user_id) VALUES($1, $2, $3) RETURNING *',

      [commentary, postId, userId]
    );

    if (rowCount > 0) {
      res.status(200);
      res.end(JSON.stringify(rows[0]));
    } else {
      res.status(500);
    }
  } else {
    res.status(400);
    res.end();
  }
};

const editComment = async (req, res) => {
  const newComment = req.body.content;
  const userId = req.session.userId;
  const postId = req.params.id;
  const commentId = req.params.commentId;

  const { rowCount } = await query('SELECT * FROM posts WHERE post_id=$1', [
    postId,
  ]);

  if (rowCount > 0) {
    if (newComment && newComment.length > 0 && userId && commentId) {
      const { rowCount, rows } = await query(
        'SELECT * FROM comments WHERE comment_id=$1 AND post_id=$2 AND user_id=$3',
        [commentId, postId, userId]
      );

      if (rowCount > 0) {
        const updatedRow = await query(
          'UPDATE comments SET comment_body=$1 WHERE comment_id=$2 RETURNING *',
          [newComment, commentId]
        );

        res.status(200);
        res.end(JSON.stringify(updatedRow.rows[0]));
      } else {
        res.status(403);
        res.end();
      }
    } else {
      res.status(400);
      res.end();
    }
  } else {
    res.status(404);
    res.end();
  }
};

const deleteComment = async (req, res) => {
  const commentId = req.params.commentId;
  const postId = req.params.id;
  const userId = req.session.userId;

  const { rowCount, rows } = await query(
    'SELECT * FROM comments WHERE post_id=$1 AND comment_id=$2',
    [postId, commentId]
  );

  if (rowCount > 0) {
    if (userId === rows[0].user_id) {
      await query(
        'DELETE FROM comments WHERE post_id=$1 AND comment_id=$2 AND user_id=$3',
        [postId, commentId, userId]
      );

      res.status(204);
      res.end();
    } else {
      res.status(403);
      res.end();
    }
  } else {
    res.status(404);
    res.end();
  }
};

const getComments = async (req, res) => {
  const postId = req.params.id;
  const { rows, rowCount } = await query(
    'SELECT * FROM comments WHERE post_id=$1',
    [postId]
  );
  if (rowCount > 0) {
    res.status(200);
    res.end(JSON.stringify(rows));
  } else {
    res.status(404);
    res.end();
  }
};

const getSingleComment = async (req, res) => {
  const postId = req.params.id;
  const commentId = req.params.commentId;

  const { rows, rowCount } = await query(
    'SELECT * FROM comments WHERE post_id=$1 AND comment_id=$2',
    [postId, commentId]
  );

  if (rowCount > 0) {
    res.status(200);
    res.end(JSON.stringify(rows[0]));
  } else {
    res.status(404);
    res.end();
  }
};

const likePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.session.userId;

  const { rowCount } = await query(
    'SELECT * FROM post_likes WHERE post_id=$1 AND user_id=$2',
    [postId, userId]
  );

  if (rowCount === 0) {
    const { rowCount } = await query(
      'INSERT INTO post_likes(post_id, user_id) VALUES($1, $2) RETURNING *',
      [postId, userId]
    );
    if (rowCount === 1) {
      res.status(204);
      res.end();
    } else {
      res.status(500);
      res.end();
    }
  } else if (rowCount === 1) {
    const { rowCount } = await query(
      'DELETE FROM post_likes WHERE user_id=$1 AND post_id=$2 RETURNING *',
      [userId, postId]
    );

    if (rowCount === 1) {
      res.status(204);
      res.end();
    } else {
      res.status(500);
      res.end();
    }
  } else {
    res.status(500);
    res.end();
  }
};

const getPostLikes = async (req, res) => {
  const postId = req.params.id;

  const { rows } = await query(
    'SELECT COUNT(*) FROM post_likes WHERE post_id=$1',
    [postId]
  );

  res.status(200);
  res.end(JSON.stringify(rows[0]));
};

const likeComment = async (req, res) => {
  const postId = req.params.id;
  const commentId = req.params.commentId;
  const userId = req.session.userId;

  const { rowCount } = await query(
    'SELECT * FROM comments_likes WHERE post_id=$1 AND comment_id=$2 AND user_id=$3',
    [postId, commentId, userId]
  );

  if (rowCount === 0) {
    const { rowCount } = await query(
      'INSERT INTO comments_likes(post_id, user_id, comment_id) VALUES ($1, $2, $3) RETURNING *',
      [postId, userId, commentId]
    );

    if (rowCount === 1) {
      res.status(204);
      res.end();
    } else {
      res.status(500);
      res.end();
    }
  } else if (rowCount === 1) {
    const { rowCount } = await query(
      'DELETE FROM comments_likes WHERE post_id=$1 AND comment_id=$2 AND user_id=$3 RETURNING *',
      [postId, commentId, userId]
    );

    if (rowCount === 1) {
      res.status(204);
      res.end();
    } else {
      res.status(500);
      res.end();
    }
  } else {
    res.status(500);
    res.end();
  }
};

const getCommentLikes = async (req, res) => {
  const postId = req.params.id;
  const commentId = req.params.commentId;

  const { rows } = await query(
    'SELECT COUNT(*) FROM comments_likes WHERE post_id=$1 AND comment_id=$2',
    [postId, commentId]
  );

  if (rows) {
    res.status(200);
    res.end(JSON.stringify(rows[0]));
  } else {
    res.status(500);
    res.end();
  }
};

const followUser = async (req, res) => {
  const userId = req.params.id;
  const followerId = req.session.userId;

  const user = await isUserExist(userId);

  if (user) {
    const { rowCount } = await query(
      'INSERT INTO followers(user_id, follower_id) VALUES($1, $2) RETURNING *',
      [userId, followerId]
    );

    if (rowCount === 1) {
      res.status(200);
      res.end();
    }
  } else {
    res.status(404);
    res.end();
  }
};

const getUserFollowers = async (req, res) => {
  const id = req.params.id;

  const user = await isUserExist(id);

  if (user) {
    const { rows } = await query('SELECT * FROM followers WHERE user_id=$1', [
      id,
    ]);

    res.status(200);
    res.end(JSON.stringify({ followers: rows }));
  } else {
    res.status(404);
    res.end();
  }
};

const deleteUserFollower = async (req, res) => {
  const userId = req.params.id;
  const followerId = req.params.followerId;

  const user = await isUserExist(userId);
  const follower = await isUserExist(followerId);

  if (user && follower) {
    const { rowCount } = await query(
      'DELETE FROM followers WHERE user_id=$1 AND follower_id=$2 RETURNING *',
      [userId, followerId]
    );
    if (rowCount > 0) {
      res.status(200);
      res.end();
    } else {
      res.status(500);
      res.end();
    }
  } else {
    res.status(404);
    res.end();
  }
};

const getUserFollowing = async (req, res) => {
  const id = req.params.id;
  const user = await isUserExist(id);

  if (user) {
    const { rows } = await query(
      'SELECT user_id FROM followers WHERE follower_id=$1',
      [id]
    );

    res.status(200);
    res.end(JSON.stringify({ following: rows }));
  } else {
    res.status(404);
    res.end();
  }
};

module.exports = {
  getUserFollowing,
  deleteUserFollower,
  getUserFollowers,
  followUser,
  getCommentLikes,
  likeComment,
  getPostLikes,
  likePost,
  getSingleComment,
  getComments,
  deleteComment,
  editComment,
  addComment,
  loginHandler,
  registerHandler,
  allPostsHandler,
  postHandler,
  createPostHandler,
  updatePostHandler,
  deletePostHandler,
};
