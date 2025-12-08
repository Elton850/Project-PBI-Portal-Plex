// src/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const { getUsers } = require('../config/authConfig');
const { jwtSecret } = require('../config/powerbiConfig');

// GET /login
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// POST /login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  // ... valida user
  // em caso de erro:
  // return res.status(401).render('login', { error: 'Credenciais inválidas.' });

  const users = getUsers();
  const user = users.find((u) => u.email === email);
  
  if (!user) {
    return res.status(401).render('login', { error: 'Credenciais inválidas.' });
  }

  const senhaOk = await bcrypt.compare(senha, user.passwordHash);
  if (!senhaOk) {
    return res.status(401).render('login', { error: 'Credenciais inválidas.' });
  }

  const tokenPayload = {
    email: user.email,
    nome: user.nome,
    departamento: user.departamentos || [],
      relatorios: user.relatorios || [],
  };

  const token = jwt.sign(tokenPayload, jwtSecret, {
    expiresIn: '8h'
  });

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax'
    // secure: true // em produção com HTTPS
  });

  res.redirect('/dashboard');
});

// GET /logout (opcional)
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;