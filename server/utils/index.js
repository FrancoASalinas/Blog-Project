module.exports = {
  isAuthenticated: (req, res, cb) => {
    if (req.session.userId) {
      cb();
    } else {
      res.status(401).send('Unauthorized');
    }
  },
};
