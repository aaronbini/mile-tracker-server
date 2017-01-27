const jwt = require('jsonwebtoken');
//TODO: Add process.env.APP_SECRET
const secret = 'somestupidword';

module.exports = {
  sign(user) {
    return new Promise((resolve, reject) => {
      jwt.sign({
        id: user._id,
        email: user.email,
        role: user.role,
      }, secret, null, (error, token) => {
        if (error) return reject(error);
        resolve(token);
      });
    });
  },

  verify(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (error, payload) => {
        if (error) return reject(error);
        resolve(payload);
      });
    });
  }

};