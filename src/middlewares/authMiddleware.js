// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/powerbiConfig');

// marca o momento em que este processo do servidor subiu
const serverStartTime = Math.floor(Date.now() / 1000);

function authRequired(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret); // inclui o 'iat' automaticamente

    // Se o token foi emitido antes do servidor subir, invalida
    if (decoded.iat && decoded.iat < serverStartTime) {
      throw new Error('Token de sessão anterior ao restart do servidor');
    }

    req.user = decoded; // { email, nome, departamento, iat, exp }
    next();
  } catch (err) {
    console.error('Token inválido/expirado/antigo:', err.message);
    res.clearCookie('token');
    return res.redirect('/login');
  }
}

module.exports = {
  authRequired
};
