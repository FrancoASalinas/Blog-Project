const express = require('express');
require('dotenv').config();
const session = require('express-session');
const cors = require('cors');
const pgSession = require('connect-pg-simple')(session);
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
  followUser,
  getUserFollowers,
  deleteUserFollower,
  getUserFollowing,
} = require('./handlers.js');

const app = express();

const authorizedPaths = ['/login', '/register'];

app.use(
  session({
    secret: 'test-secret',
    resave: true,
    saveUninitialized: false,
    store: new pgSession({
      conString: `postgres://${process.env.DBUSER}:${process.env.DBPASSWORD}@${
        process.env.DBHOST
      }:${process.env.DBPORT}/${
        process.env.NODE_ENV === 'test'
          ? process.env.DBDATABASE_TEST
          : process.env.DBDATABASE
      }`,
      createTableIfMissing: true,
    }),
    cookie: {
      httpOnly: false,
      secure: false,
      sameSite: false,
    },
  })
);

app.use(cors({ credentials: true, origin: 'http://localhost:5173' }));

app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.session.userId || authorizedPaths.includes(req.path)) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
});

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

//Follow an user
app.post('/users/:id/followers', followUser);

//Get user's followers
app.get('/users/:id/followers', getUserFollowers);

//Unfollow user
app.delete('/users/:id/followers/:followerId', deleteUserFollower);

//Get user's following
app.get('/users/:id/following', getUserFollowing);

//Not Found
app.use((req, res) => {
  res.status(404).send('Not Found');
});

module.exports = app;
