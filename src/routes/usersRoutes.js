// src/routes/usersRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { authRequired } = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/adminMiddleware');
const { getUsers, saveUsers } = require('../config/authConfig');
const { getDepartments } = require('../config/departmentsConfig');

const router = express.Router();

// ===================== LISTAGEM =====================
router.get('/users', authRequired, adminOnly, (req, res) => {
  const users = getUsers();
  res.render('users', { user: req.user, users });
});

// ===================== NOVO (FORM) =====================
router.get('/users/new', authRequired, adminOnly, (req, res) => {
  const departments = getDepartments();
  res.render('userForm', {
    user: req.user,
    editUser: null,
    error: null,
    departments
  });
});

// ===================== NOVO (CREATE) =====================
router.post('/users/new', authRequired, adminOnly, async (req, res) => {
  const departments = getDepartments();
  try {
    const users = getUsers();

    const nome = (req.body.nome || '').trim();
    const email = (req.body.email || '').trim();
    const senha = (req.body.senha || '').trim();

    const tipoPessoa = (req.body.tipoPessoa || 'PF').toUpperCase(); // PF | PJ
    const cpfClean = (req.body.cpf || '').trim();

    const ativo = !!req.body.ativo;
    const isAdmin = !!req.body.isAdmin;

    let departamentos = req.body.departamentos || [];
    if (typeof departamentos === 'string') departamentos = [departamentos];

    let relatorios = req.body.relatorios || [];
    if (typeof relatorios === 'string') relatorios = [relatorios];

    // validações básicas
    if (!nome || !email || !senha) {
      return res.status(400).render('userForm', {
        user: req.user,
        editUser: null,
        error: 'Nome, e-mail e senha são obrigatórios.',
        departments
      });
    }

    // email único
    if (users.some(u => u.email === email)) {
      return res.status(400).render('userForm', {
        user: req.user,
        editUser: null,
        error: 'Já existe um usuário com este e-mail.',
        departments
      });
    }

    // CPF: PF obrigatório e único | PJ não exige CPF
    if (tipoPessoa !== 'PJ') {
      if (!cpfClean) {
        return res.status(400).render('userForm', {
          user: req.user,
          editUser: null,
          error: 'CPF é obrigatório para PF.',
          departments
        });
      }
      const cpfEmUso = users.some(u => u.tipoPessoa !== 'PJ' && u.cpf === cpfClean);
      if (cpfEmUso) {
        return res.status(400).render('userForm', {
          user: req.user,
          editUser: null,
          error: 'Já existe usuário com esse CPF.',
          departments
        });
      }
    }

    const passwordHash = await bcrypt.hash(senha, 10);

    users.push({
      nome,
      email,
      passwordHash,
      tipoPessoa,
      cpf: tipoPessoa === 'PJ' ? null : cpfClean,
      departamentos,
      relatorios,
      ativo,
      isAdmin
    });

    saveUsers(users);
    return res.redirect('/users');
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    return res.status(500).render('userForm', {
      user: req.user,
      editUser: null,
      error: 'Erro ao salvar usuário.',
      departments
    });
  }
});

// ===================== EDIT (FORM) =====================
router.get('/users/:email/edit', authRequired, adminOnly, (req, res) => {
  const users = getUsers();
  const u = users.find(x => x.email === req.params.email);
  if (!u) return res.redirect('/users');

  const departments = getDepartments();
  res.render('userForm', {
    user: req.user,
    editUser: u,
    departments,
    error: null
  });
});

// ===================== EDIT (SAVE) =====================
router.post('/users/:email/edit', authRequired, adminOnly, async (req, res) => {
  const departments = getDepartments();
  try {
    const users = getUsers();
    const idx = users.findIndex(x => x.email === req.params.email);
    if (idx === -1) return res.redirect('/users');

    const nome = (req.body.nome || '').trim();
    const email = (req.body.email || '').trim();
    const senha = (req.body.senha || '').trim();

    const tipoPessoa = (req.body.tipoPessoa || 'PF').toUpperCase();
    const cpfClean = (req.body.cpf || '').trim();

    const ativo = !!req.body.ativo;
    const isAdmin = !!req.body.isAdmin;

    let departamentos = req.body.departamentos || [];
    if (typeof departamentos === 'string') departamentos = [departamentos];

    let relatorios = req.body.relatorios || [];
    if (typeof relatorios === 'string') relatorios = [relatorios];

    // validações básicas
    if (!nome || !email) {
      return res.status(400).render('userForm', {
        user: req.user,
        editUser: users[idx],
        error: 'Nome e e-mail são obrigatórios.',
        departments
      });
    }

    // email único (permitindo manter o mesmo)
    const emailEmUso = users.some((u, i) => i !== idx && u.email === email);
    if (emailEmUso) {
      return res.status(400).render('userForm', {
        user: req.user,
        editUser: users[idx],
        error: 'Já existe outro usuário com este e-mail.',
        departments
      });
    }

    // CPF: PF obrigatório e único | PJ não exige CPF
    if (tipoPessoa !== 'PJ') {
      if (!cpfClean) {
        return res.status(400).render('userForm', {
          user: req.user,
          editUser: users[idx],
          error: 'CPF é obrigatório para PF.',
          departments
        });
      }
      const cpfEmUso = users.some(
        (u, i) => i !== idx && u.tipoPessoa !== 'PJ' && u.cpf === cpfClean
      );
      if (cpfEmUso) {
        return res.status(400).render('userForm', {
          user: req.user,
          editUser: users[idx],
          error: 'Já existe outro usuário com esse CPF.',
          departments
        });
      }
    }

    // aplica alterações
    users[idx].nome = nome;
    users[idx].email = email;
    users[idx].tipoPessoa = tipoPessoa;
    users[idx].cpf = tipoPessoa === 'PJ' ? null : cpfClean;
    users[idx].departamentos = departamentos;
    users[idx].relatorios = relatorios;
    users[idx].ativo = ativo;
    users[idx].isAdmin = isAdmin;

    if (senha && senha.length >= 4) {
      users[idx].passwordHash = await bcrypt.hash(senha, 10);
    }

    saveUsers(users);
    return res.redirect('/users');
  } catch (err) {
    console.error('Erro ao editar usuário:', err);
    return res.status(500).render('userForm', {
      user: req.user,
      editUser: null,
      error: 'Erro ao salvar usuário.',
      departments
    });
  }
});

module.exports = router;