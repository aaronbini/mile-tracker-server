const jwt = require('jsonwebtoken');

const secret = process.env.APP_SECRET;
//TODO: Sign the token with the orgId as well
module.exports = {
  sign(user) {
    return new Promise((resolve, reject) => {
      jwt.sign({
        id: user._id,
        email: user.email,
        role: user.role,
        organization: user.organization
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