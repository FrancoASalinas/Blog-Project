const bcrypt = require('bcryptjs');
module.exports = {
  isAuthenticated: (req, res, cb) => {
    if (req.session.userId) {
      cb();
    } else {
      res.status(401).send('Unauthorized');
    }
  },
  hashPassword: (password, cb) => {
    bcrypt.genSalt((err, salt) => {
      if (err) return cb(err);

      bcrypt.hash(password, salt, (err, hash) => {
        return cb(err, hash, salt);
      });
    });
  },
  compareHash: (password, hash, cb) => {
    bcrypt.compare(password, hash, (err, isSame) => {
      return cb(err, isSame);
    });
  },
};
