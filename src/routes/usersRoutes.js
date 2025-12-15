// src/routes/usersRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { authRequired } = require('../middlewares/authMiddleware');
const { getUsers, saveUsers } = require('../config/authConfig');
const { getDepartments } = require('../config/departmentsConfig');
const { adminOnly } = require('../middlewares/adminMiddleware');

const router = express.Router();

// listagem
router.get('/users', authRequired, adminOnly, (req, res) => {
  const users = getUsers();
  res.render('users', { user: req.user, users });
});

// página de cadastro (ÚNICA)
router.get('/users/new', authRequired, adminOnly, (req, res) => {
  const departments = getDepartments();
  res.render('userForm', {
    user: req.user,
    error: null,
    departments
  });
});

// criação de usuário
router.post('/users/new', authRequired, adminOnly, async (req, res) => {
  try {
    const { nome, cpf, email, senha } = req.body;
    const ativo = !!req.body.ativo;

    let departamentos = req.body.departamentos || [];
    if (typeof departamentos === 'string') departamentos = [departamentos];

    let relatorios = req.body.relatorios || [];
    if (typeof relatorios === 'string') relatorios = [relatorios];

    if (!nome || !cpf || !email || !senha) {
      const departments = getDepartments();
      return res.status(400).render('userForm', {
        user: req.user,
        error: 'Nome, CPF, e-mail e senha são obrigatórios.',
        departments
      });
    }

    const users = getUsers();

    const isAdmin = !!req.body.isAdmin;

    if (users.find(u => u.email === email)) {
      const departments = getDepartments();
      return res.status(400).render('userForm', {
        user: req.user,
        error: 'Já existe um usuário com este e-mail.',
        departments
      });
    }

    const passwordHash = await bcrypt.hash(senha, 10);

    users.push({
      nome,
      cpf,
      email,
      passwordHash,
      departamentos,
      relatorios,
      ativo,
      isAdmin
    });

    saveUsers(users);
    return res.redirect('/users');
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    const departments = getDepartments();
    return res.status(500).render('userForm', {
      user: req.user,
      error: 'Erro ao salvar usuário.',
      departments
    });
  }
});

module.exports = router;