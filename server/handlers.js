const { query } = require('./database');
const { isAuthenticated, hashPassword, compareHash } = require('./utils/index');

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
            res.end(JSON.stringify(rows[0].user_id));
          } else {
            res.status(400).send('Username or password are incorrect');
          }
        }
      });
    } else {
      res.status(400).send('Username or password are incorrect');
    }
  } else {
    res.status(400).send('Username and password required');
  }
};

const registerHandler = async (req, res) => {
  const { username, password } = req.body;

  if (username && password) {
    const takenUsername = await query(
      'SELECT * FROM users WHERE user_name=$1',
      [username]
    );

    if (takenUsername.rowCount !== 0) {
      res.status(409).send('Username is already taken');
      res.end();
      return;
    }

    hashPassword(password, async (err, hash, salt) => {
      if (err) {
        console.log(err);
        res.status(500);
        res.end();
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
    res.status(400).send('Username and password required');
  }
};

const allPostsHandler = async (req, res) => {
  isAuthenticated(req, res, async () => {
    const { rows } = await query('SELECT * FROM posts');

    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify(rows));
  });
};

const postHandler = async (req, res) => {
  isAuthenticated(req, res, async () => {
    const { id } = req.params;
    const { rows } = await query('SELECT * FROM posts WHERE post_id=$1', [id]);
    const post = rows.length === 1;

    if (post) {
      res.writeHead(200, { 'Content-type': 'application/json' });
      res.end(JSON.stringify(rows[0]));
    } else {
      res.writeHead(404, { 'Content-type': 'text/plain' });
      res.end('Post not found or id invalid');
    }
  });
};

const createPostHandler = async (req, res) => {
  isAuthenticated(req, res, async () => {
    const { body } = req;

    if (body.content && body.author) {
      const { rows } = await query(
        'INSERT INTO posts(post_author, post_body) VALUES($1, $2) RETURNING *',
        [body.author, body.content]
      );

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows[0]));
    } else {
      res.writeHead(400, 'Bad Request');
      res.end('There is an error on the request syntax');
    }
  });
};

const updatePostHandler = (req, res) => {
  isAuthenticated(req, res, async () => {
    const { body } = req;
    if (body.content) {
      const { id } = req.params;
      const { rows } = await query(
        'UPDATE posts SET post_body=$1 WHERE post_id=$2 RETURNING *',
        [body.content, id]
      );

      res.status(200).send(JSON.stringify(rows[0]));
    } else {
      res.status(400).send('There is an error on the request syntax');
    }
  });
};

const deletePostHandler = async (req, res) => {
  isAuthenticated(req, res, async () => {
    const { id } = req.params;

    await query('DELETE FROM posts WHERE post_id=$1', [id]);

    res.status(204);
    res.end();
  });
};

const addComment = async (req, res) => {
  isAuthenticated(req, res, async () => {
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
  });
};

const editComment = async (req, res) => {
  isAuthenticated(req, res, async () => {
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
  });
};

const deleteComment = async (req, res) => {
  isAuthenticated(req, res, async () => {
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
  });
};

const getComments = async (req, res) => {
  isAuthenticated(req, res, async () => {
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
  });
};

const getSingleComment = async (req, res) => {
  isAuthenticated(req, res, async () => {
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
  });
};

const likePost = async (req, res) => {
  isAuthenticated(req, res, async () => {
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
  });
};

const getPostLikes = async (req, res) => {
  isAuthenticated(req, res, async () => {
    const postId = req.params.id;

    const { rows } = await query(
      'SELECT COUNT(*) FROM post_likes WHERE post_id=$1',
      [postId]
    );

    res.status(200);
    res.end(JSON.stringify(rows[0]));
  });
};

module.exports = {
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
