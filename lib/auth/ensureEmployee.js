module.exports = function ensureEmployee (req, res, next) {
  const eeToken = req.body.token;
  if(!eeToken) {
    return res.status(403).send({message: 'Authorization failed.'});
  }
  if (eeToken === process.env.EE_TOKEN) {
    next();
  } else {
    next({status: 403, message: 'Authorization Failed.'});
  }
};