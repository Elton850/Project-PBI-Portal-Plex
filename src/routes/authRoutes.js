// src/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const { getUsers, saveUsers } = require('../config/authConfig');
const { jwtSecret } = require('../config/powerbiConfig');

// GET /login
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const users = getUsers();
    const user = users.find(u => u.email === email);

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
      departamentos: user.departamentos || [],
      // compatibilidade (se algum lugar ainda usar)
      departamento: user.departamentos || [],
      relatorios: user.relatorios || [],
      isAdmin: !!user.isAdmin,
      tipoPessoa: (user.tipoPessoa || 'PF').toUpperCase()
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '8h' });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax'
      // secure: true // produção com HTTPS
    });

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).render('login', { error: 'Erro interno no login.' });
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// GET /forgot
router.get('/forgot', (req, res) => {
  res.render('forgot', { error: null, ok: null });
});

// POST /forgot
router.post('/forgot', async (req, res) => {
  try {
    const { cpf, email, tokenPJ, novaSenha } = req.body;
    const users = getUsers();

    if (!novaSenha || novaSenha.trim().length < 4) {
      return res.status(400).render('forgot', { error: 'Nova senha muito curta.', ok: null });
    }

    let u = null;

    // PF: encontra por CPF
    if (cpf && cpf.trim()) {
      const cpfClean = cpf.trim();
      u = users.find(x => (x.tipoPessoa || 'PF').toUpperCase() !== 'PJ' && x.cpf === cpfClean);
      if (!u) {
        return res.status(400).render('forgot', { error: 'CPF não encontrado.', ok: null });
      }
    } else {
      // PJ: exige email + token
      if (!email || !email.trim() || !tokenPJ || !tokenPJ.trim()) {
        return res.status(400).render('forgot', {
          error: 'Para PJ informe e-mail e token.',
          ok: null
        });
      }

      const emailClean = email.trim();
      const tokenClean = tokenPJ.trim().toUpperCase();

      u = users.find(x =>
        (x.tipoPessoa || 'PF').toUpperCase() === 'PJ' &&
        x.email === emailClean &&
        ((x.resetToken || '').toUpperCase() === tokenClean)
      );

      if (!u) {
        return res.status(400).render('forgot', { error: 'E-mail ou token inválido.', ok: null });
      }
    }

    u.passwordHash = await bcrypt.hash(novaSenha.trim(), 10);
    saveUsers(users);

    return res.render('forgot', { error: null, ok: 'Senha atualizada. Faça login.' });
  } catch (err) {
    console.error('Erro no reset de senha:', err);
    return res.status(500).render('forgot', { error: 'Erro ao resetar senha.', ok: null });
  }
});

module.exports = router;
