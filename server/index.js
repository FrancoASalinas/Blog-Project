const express = require('express');
const session = require('express-session');
const { query } = require('./database.js');
const { isAuthenticated } = require('./utils/index.js');

const PORT = 5000;

const app = express();

app.use(
  session({ secret: 'test-secret', resave: true, saveUninitialized: false })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`server running on port: ${PORT}`);
});

//login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if(username && password){

  const { rows } = await query(
    'SELECT * FROM users WHERE user_name=$1 AND user_password=$2',
    [username, password]
    );
      
    if (rows.length > 0) {
      req.session.userId = rows[0].user_id;
    res.status(200).send('Successfully authenticated');
  } else {
    res.status(400).send('User Not Found');
  }
} else {
  res.status(400).send('Username and password required');
}
});

//register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (username && password) {
    const takenUsername = await query(
      'SELECT * FROM users WHERE user_name=$1',
      [username]
    );

    if (takenUsername.rowCount !== 0) {
      res.status(409).send('Username is already taken');
      res.end();
      return
    }

    const insertUser = await query(
      'INSERT INTO users(user_name, user_password) VALUES($1, $2) RETURNING *',
      [username, password]
    );

    if (insertUser.rowCount > 0) {
      res.status(200).send('User registered');
    } else {
      res.status(500);
      res.end()
    }
  } else {
    res.status(400).send('Username and password required');
  }
});

//Get all posts
app.get('/posts', async (req, res) => {
  isAuthenticated(req, res, async () => {
    const { rows } = await query('SELECT * FROM posts');

    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify(rows));
  });
});

//Get post using post_id
app.get('/posts/:id', async (req, res) => {
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
});

//Create a post
app.post('/posts', async (req, res) => {
  isAuthenticated(req, res, async () => {
    const { body } = req;

    if (body.content && body.username) {
      const { rows } = await query(
        'INSERT INTO posts(post_author, post_body) VALUES($1, $2) RETURNING *',
        [body.username, body.content]
      );

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows[0]));
    } else {
      res.writeHead(400, 'Bad Request');
      res.end('There is an error on the request syntax');
    }
  });
});

//Update a post using post_id
app.put('/posts/:id', (req, res) => {
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
});

//Delete a post using post_id
app.delete('/posts/:id', async (req, res) => {
  isAuthenticated(req, res, async () => {
    const { id } = req.params;

    await query('DELETE FROM posts WHERE post_id=$1', [id]);

    res.writeHead(204, { 'Content-Type': 'application/json' });
    res.end();
  });
});

//Not Found
app.use((req, res) => {
  res.status(404).send('Not Found');
});
