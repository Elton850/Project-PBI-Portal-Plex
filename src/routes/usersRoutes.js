// src/routes/usersRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { authRequired } = require('../middlewares/authMiddleware');
const { getUsers, saveUsers } = require('../config/authConfig');

const router = express.Router();

// listagem
router.get('/users', authRequired, (req, res) => {
  const users = getUsers();
  res.render('users', {
    user: req.user,
    users
  });
});

// NOVO: página de cadastro
router.get('/users/new', authRequired, (req, res) => {
  res.render('userForm', {
    user: req.user,
    error: null
  });
});

// criação de usuário
router.post('/users/new', authRequired, async (req, res) => {

  try {
    const { nome, cpf, email, senha } = req.body;
    const ativo = !!req.body.ativo;

    // DEPARTAMENTOS
    let departamentos = req.body.departamentos || [];
    if (typeof departamentos === 'string') {
      departamentos = [departamentos];
    }

    // RELATÓRIOS
    let relatorios = req.body.relatorios || [];
    if (typeof relatorios === 'string') {
      relatorios = [relatorios];
    }

    if (!nome || !cpf || !email || !senha) {
      return res.status(400).render('userForm', {
        user: req.user,
        error: 'Nome, CPF, e-mail e senha são obrigatórios.'
      });
    }

    const users = getUsers();

    if (users.find(u => u.email === email)) {
      return res.status(400).render('userForm', {
        user: req.user,
        error: 'Já existe um usuário com este e-mail.'
      });
    }

    const passwordHash = await bcrypt.hash(senha, 10);

    const newUser = {
      nome,
      cpf,
      email,
      passwordHash,
      departamentos,
      relatorios,
      ativo
    };

    users.push(newUser);
    saveUsers(users);

    return res.redirect('/users');
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    return res.status(500).render('userForm', {
      user: req.user,
      error: 'Erro ao salvar usuário.'
    });
  }
});

module.exports = router;