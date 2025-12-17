// src/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const { getUsers, saveUsers } = require('../config/authConfig'); // << IMPORTA saveUsers
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

      // CORRETO: departamentos (array)
      departamentos: user.departamentos || [],

      // mantém compatibilidade se algum lugar ainda usar "departamento"
      // (opcional, pode remover depois)
      departamento: user.departamentos || [],

      relatorios: user.relatorios || [],
      isAdmin: !!user.isAdmin,
      tipoPessoa: user.tipoPessoa || 'PF'
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
    const { cpf, email, novaSenha } = req.body;
    const users = getUsers();

    let u = null;

    // PF: encontra por CPF (obrigatório)
    if (cpf && cpf.trim()) {
      const cpfClean = cpf.trim();
      u = users.find(x => (x.tipoPessoa || 'PF') !== 'PJ' && x.cpf === cpfClean);
    } else {
      // PJ: não exige CPF -> usa email
      if (!email || !email.trim()) {
        return res
          .status(400)
          .render('forgot', { error: 'Informe CPF (PF) ou e-mail (PJ).', ok: null });
      }

      const emailClean = email.trim();
      u = users.find(x => (x.tipoPessoa || 'PF') === 'PJ' && x.email === emailClean);
    }

    if (!u) {
      return res.status(400).render('forgot', { error: 'Usuário não encontrado.', ok: null });
    }

    if (!novaSenha || novaSenha.trim().length < 4) {
      return res.status(400).render('forgot', { error: 'Nova senha muito curta.', ok: null });
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