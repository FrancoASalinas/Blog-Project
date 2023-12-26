const bcrypt = require('bcryptjs');
const { query } = require('../database');

const tests = {
  isLargerThan: (param, n) =>
    param.trim().length >= n
      ? null
      : `Input must be larger than ${n} characters`,
  isShorterThan: (param, n) =>
    param.trim().length <= n
      ? null
      : `Input must be shorter than ${n} characters`,
  validCharacters: param => {
    const trimmed = param.trim();
    const regEx = /^[^.]([a-z]{1,}|[0-9])+[^.]$/i;

    if (trimmed.length > 0) {
      return regEx.test(trimmed) ? null : 'Input has invalid characters';
    } else return null;
  },
};

module.exports = {
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
    !(password.trim() === confirm.trim()) && ['Passwords are not equal'],
  isUserExist: async userId => {
    if (!isNaN(userId)) {
      const { rowCount } = await query('SELECT * FROM users WHERE user_id=$1', [
        userId,
      ]);

      if (rowCount === 1) return true;
      return false;
    }
    return false;
  },
  getSinglePost: async (userId, postId) =>
    await query(
      'SELECT p.*, u.user_name, EXISTS(SELECT FROM post_likes l WHERE l.post_id=p.post_id AND l.user_id=$1) as is_liked FROM posts p INNER JOIN users u ON p.post_author=u.user_id, LATERAL(SELECT CAST(COUNT(*) AS INTEGER) FROM post_likes WHERE post_id=p.post_id) as post_likes WHERE post_id=$2',
      [userId, postId]
    ),
};
