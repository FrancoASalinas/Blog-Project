const express = require('express');
const session = require('express-session');
const {
  loginHandler,
  registerHandler,
  postHandler,
  allPostsHandler,
  updatePostHandler,
  deletePostHandler,
  createPostHandler,
} = require('./handlers.js');

const app = express();

app.use(
  session({ secret: 'test-secret', resave: true, saveUninitialized: false })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//login
app.post('/login', loginHandler);

//register
app.post('/register', registerHandler);

//Get all posts
app.get('/posts', allPostsHandler);

//Get post using post_id
app.get('/posts/:id', postHandler);

//Create a post
app.post('/posts', createPostHandler);

//Update a post using post_id
app.put('/posts/:id', updatePostHandler);

//Delete a post using post_id
app.delete('/posts/:id', deletePostHandler);

//Not Found
app.use((req, res) => {
  res.status(404).send('Not Found');
});

module.exports = app;
