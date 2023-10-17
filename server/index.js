const express = require('express');
const { query } = require('./database.js');

const PORT = 5000;

const app = express();

//Get all posts
app.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM posts');

  res.writeHead(200, { 'Content-type': 'application/json' });
  res.end(JSON.stringify(rows));
});

app.listen(PORT, () => {
  console.log(`server running on port: ${PORT}`);
});

//Get post using post_id
app.get('/:id', async (req, res) => {
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

//Create a post
app.post('/submit', (req, res) => {
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', async () => {
    const newPost = JSON.parse(body);

    if (newPost.content && newPost.username) {
      const { rows } = await query(
        'INSERT INTO posts(post_author, post_body) VALUES($1, $2) RETURNING *',
        [newPost.username, newPost.content]
      );

      res.writeHead(201, { 'Content-Type': 'text/plain' });
      res.end(JSON.stringify(rows[0]));
    } else {
      res.writeHead(400, 'Bad Request');
      res.end('There is an error on the request syntax');
    }
  });
});

//Update a post using post_id
app.put('/:id', (req, res) => {
  const { id } = req.params;
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', async () => {
    const { rows } = await query(
      'UPDATE posts SET post_body=$1 WHERE post_id=$2 RETURNING *',
      [body, id]
    );

    res.end(JSON.stringify(rows[0]));
  });
});

//Delete a post using post_id
app.delete('/:id', async (req, res) => {
  const { id } = req.params;

  await query('DELETE FROM posts WHERE post_id=$1', [id]);

  res.writeHead(204, { 'Content-Type': 'application/json' });
  res.end();
});

//Not Found
app.use((req, res) => {
  res.status(404).send('Not Found');
});
