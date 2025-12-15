function adminOnly(req, res, next) {
  if (req.user && req.user.isAdmin) return next();
  return res.status(403).send('Acesso negado.');
}

module.exports = { adminOnly };