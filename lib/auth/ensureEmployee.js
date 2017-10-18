//TODO: revamp this, will need to check token orgId against orgId passed in route
//TODO: modify endpoints - orgId will need to be passed
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