module.exports = function getEnsureRole (role) {
  return function ensureRole (req, res, next) {
    if (req.user.role.indexOf(role) !== -1) {
      next();
    } else {
      next({status: 403, message: 'not authorized'});
    }
  };
};