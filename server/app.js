const express = require('express');
const session = require('express-session');
const cors = require('cors');
const {
  loginHandler,
  registerHandler,
  postHandler,
  allPostsHandler,
  updatePostHandler,
  deletePostHandler,
  createPostHandler,
  addComment,
  editComment,
  deleteComment,
  getComments,
  getSingleComment,
  likePost,
  getPostLikes,
  likeComment,
  getCommentLikes,
} = require('./handlers.js');

const app = express();

app.use(cors())

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(
  session({ secret: 'test-secret', resave: true, saveUninitialized: false })
);

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

//Create a comment on a post
app.post('/posts/:id/comments', addComment);

//Edit a comment
app.put('/posts/:id/comments/:commentId', editComment);

//Delete a comment
app.delete('/posts/:id/comments/:commentId', deleteComment);

//Get all comments
app.get('/posts/:id/comments', getComments);

//Get a single comment
app.get('/posts/:id/comments/:commentId', getSingleComment);

//Like or dislike a post
app.post('/posts/:id/likes', likePost);

//Get post's likes
app.get('/posts/:id/likes', getPostLikes);

//Like or dislike a comment
app.post('/posts/:id/comments/:commentId/likes', likeComment);

//Get a comment likes
app.get('/posts/:id/comments/:commentId/likes', getCommentLikes);

//Not Found
app.use((req, res) => {
  res.status(404).send('Not Found');
});

module.exports = app;
