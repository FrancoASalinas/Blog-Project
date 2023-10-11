const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
let data = [];
const dataPath = './data.json';

if (fs.existsSync(dataPath)) {
  const jsonData = fs.readFileSync(dataPath, 'utf-8');
  data = JSON.parse(jsonData);
} else {
  console.log('no such file path found');

  fs.readdir('./', (err, files) => {
    err && console.log('error reading dir: ', err);

    const dirents = [];

    for (const file of files) {
      const fullPath = path.join('./', file);

      if (fs.statSync(fullPath).isFile()) {
        dirents.push(fullPath);
      }

      console.log('directory entries: ', dirents);
    }
  });
}

const server = http.createServer((req, res) => {
  const { method, url, headers } = req;
  const parsedURL = new URL(url, `http://${headers.host}`);

  if (
    method === 'GET' &&
    parsedURL.pathname === '/posts' &&
    parsedURL.search === ''
  ) {
    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify(data.posts));
  } else if (
    method === 'GET' &&
    parsedURL.pathname === '/posts' &&
    parsedURL.searchParams.get('id')
  ) {
    const id = Number(parsedURL.searchParams.get('id'));

    const post = data.posts.find(post => post.id === id);

    if (post) {
      res.writeHead(200, { 'Content-type': 'application/json' });
      res.end(JSON.stringify(data.posts.filter(post => post.id === id)));
    } else {
      res.writeHead(404, { 'Content-type': 'text/plain' });
      res.end('Post not found or id invalid');
    }
  } else if (method === 'POST' && parsedURL.pathname === '/posts') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      const newPost = JSON.parse(body);
      newPost.id = data.posts.length + 1;
      data.posts.push(newPost);

      fs.writeFileSync(dataPath, JSON.stringify(data));
      res.writeHead(201, { 'Content-Type': 'text/plain' });
      res.end(JSON.stringify(newPost));
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

    const post = data.posts.find(post => post.id === id);

    if (post) {
      req.on('end', () => {
        const title = JSON.parse(body).title;
        const content = JSON.parse(body).content;

        data.posts.map(post => {
          if (post.id === id) {
            post.title = title;
            post.content = content;
          }
        });

        fs.writeFileSync(dataPath, JSON.stringify(data));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data.posts.filter(post => (post.id = id)))[0];
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Post not found or id invalid');
    }
  } else if (
    method === 'DELETE' &&
    parsedURL.pathname === '/posts' &&
    parsedURL.searchParams.get('id')
  ) {
    const id = Number(parsedURL.searchParams.get('id'));
    const post = data.posts.find(post => post.id === id);

    if (post) {
      data.posts.filter(post => post.id !== post.id);
      fs.writeFileSync(dataPath, JSON.parse(data));

      res.writeHead(204, { 'Content-Type': 'application/json' });
      res.end();
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Post not found or id invalid');
    }
  }
  {
    res.writeHead(404, 'text/plain');
    res.end('Error: Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`server running on port: ${PORT}`);
});
