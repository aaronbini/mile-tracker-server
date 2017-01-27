const tokenChecker = require('./token');

module.exports = function ensureAuth (req, res, next) {
  if (req.method === 'OPTIONS') return next();

  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '') : '';

  if(!token) {
    return res.status(403).send({message: 'Authorization failed, token missing.'});
  }

  tokenChecker.verify(token)
    .then(payload => {
      req.user = payload;
      next();
    })
    .catch(error => {
      console.log('Error verifying token:',error);
      res.status(403).send({message: 'Authorization failed, token invalid.'});
    });

};