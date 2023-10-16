const http = require('http');
const { query } = require('./database.js');

const PORT = 5000;

const server = http.createServer();

server.on('request', async (req, res) => {
  const { method, url, headers } = req;
  const parsedURL = new URL(url, `http://${headers.host}`);

  if (
    method === 'GET' &&
    parsedURL.pathname === '/posts' &&
    !parsedURL.searchParams.get('id')
  ) {
    const clientQuery = await query('SELECT * FROM posts');

    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify(clientQuery.rows));
  } else if (
    method === 'GET' &&
    parsedURL.pathname === '/posts' &&
    parsedURL.searchParams.get('id')
  ) {
    const id = Number(parsedURL.searchParams.get('id'));
    const clientQuery = await query('SELECT * FROM posts WHERE post_id=$1', [
      id,
    ]);
    const post = clientQuery.rows.length === 1;

    if (post) {
      res.writeHead(200, { 'Content-type': 'application/json' });
      res.end(JSON.stringify(clientQuery.rows[0]));
    } else {
      res.writeHead(404, { 'Content-type': 'text/plain' });
      res.end('Post not found or id invalid');
    }
  } else if (method === 'POST' && parsedURL.pathname === '/posts') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      const newPost = JSON.parse(body);

      if (newPost.content && newPost.username) {
        const clientQuery = await query(
          'INSERT INTO posts(post_author, post_body) VALUES($1, $2) RETURNING *',
          [newPost.username, newPost.content]
        );

        res.writeHead(201, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(clientQuery.rows[0]));
      } else {
        res.writeHead(400, 'Bad Request');
        res.end('There is an error on the request syntax');
      }
    });
  } else if (
    method === 'PUT' &&
    parsedURL.pathname === '/posts' &&
    parsedURL.searchParams.get('id')
  ) {
    const id = Number(parsedURL.searchParams.get('id'));
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      const clientQuery = await query(
        'UPDATE posts SET post_body=$1 WHERE post_id=$2 RETURNING *',
        [body, id]
      );

      res.end(JSON.stringify(clientQuery.rows[0]));
    });
  } else if (
    method === 'DELETE' &&
    parsedURL.pathname === '/posts' &&
    parsedURL.searchParams.get('id')
  ) {
    const id = Number(parsedURL.searchParams.get('id'));

    await query('DELETE FROM posts WHERE post_id=$1', [id]);

    res.writeHead(204, { 'Content-Type': 'application/json' });
    res.end();
  } else {
    res.writeHead(404, 'text/plain');
    res.end('Error: Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`server running on port: ${PORT}`);
});
