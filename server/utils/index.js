const bcrypt = require('bcryptjs');

const tests = {
  isLargerThan: (param, n) =>
    param.trim().length >= n
      ? null
      : `Input must be larger than ${n} characters`,
  isShorterThan: (param, n) =>
    param.trim().length <= n
      ? null
      : `Input must be shorter than ${n} characters`,
  validCharacters: param =>
    param.trim().match(/\w/i) ? null : 'Input has invalid characters',
};

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

  validateUsername: username => {
    const errors = [];
    const minChars = 4;
    const maxChars = 16;

    errors.push(
      tests.isLargerThan(username, minChars),
      tests.isShorterThan(username, maxChars),
      tests.validCharacters(username)
    );

    const array = errors.filter(error => error !== null);
    return array.length > 0 && array;
  },

  validatePassword: password => {
    const errors = [];
    const minChars = 6;
    const maxChars = 20;

    errors.push(
      tests.isLargerThan(password, minChars),
      tests.isShorterThan(password, maxChars),
      tests.validCharacters(password)
    );

    const array = errors.filter(error => error !== null);

    return array.length > 0 && array;
  },

  passwordIsConfirmed: (password, confirm) =>
    !(password === confirm) && ['Passwords are not equal'],
};
