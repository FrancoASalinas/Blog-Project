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
            res.status(200).send('Successfully authenticated');
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
        res.status(200).send('User registered');
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

      res.end(JSON.stringify(rows[0]));
    } else {
      res.status(400).send('There is an error on the request syntax');
    }
  });
};

const deletePostHandler = async (req, res) => {
  isAuthenticated(req, res, async () => {
    const { id } = req.params;

    await query('DELETE FROM posts WHERE post_id=$1', [id]);

    res.writeHead(204, { 'Content-Type': 'application/json' });
    res.end();
  });
};

module.exports = {
  loginHandler,
  registerHandler,
  allPostsHandler,
  postHandler,
  createPostHandler,
  updatePostHandler,
  deletePostHandler,
};
