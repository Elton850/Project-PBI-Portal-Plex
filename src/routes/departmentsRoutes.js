const express = require('express');
const { authRequired } = require('../middlewares/authMiddleware');
const { getDepartments, saveDepartments } = require('../config/departmentsConfig');
const { adminOnly } = require('../middlewares/adminMiddleware');

const router = express.Router();

// LISTAR
router.get('/departments', authRequired, adminOnly, (req, res) => {
  const departments = getDepartments();
  res.render('departments', { user: req.user, departments, error: null });
});

// FORM NOVO
router.get('/departments/new', authRequired, adminOnly, (req, res) => {
  res.render('departmentForm', { user: req.user, dep: null, error: null });
});

// CRIAR
router.post('/departments/new', authRequired, adminOnly, (req, res) => {
  const { id, nome } = req.body;

  if (!id || !nome) {
    return res.status(400).render('departmentForm', {
      user: req.user, dep: null, error: 'ID e Nome são obrigatórios.'
    });
  }

  const departments = getDepartments();

  if (departments.some(d => d.id.toUpperCase() === id.toUpperCase())) {
    return res.status(400).render('departmentForm', {
      user: req.user, dep: null, error: 'Já existe um departamento com esse ID.'
    });
  }

  departments.push({ id: id.trim().toUpperCase(), nome: nome.trim() });
  saveDepartments(departments);

  res.redirect('/departments');
});

// FORM EDITAR
router.get('/departments/:id/edit', authRequired, adminOnly, (req, res) => {
  const departments = getDepartments();
  const dep = departments.find(d => d.id === req.params.id);

  if (!dep) return res.redirect('/departments');

  res.render('departmentForm', { user: req.user, dep, error: null });
});

// SALVAR EDIÇÃO
router.post('/departments/:id/edit', authRequired, adminOnly, (req, res) => {
  const { nome } = req.body;
  const id = req.params.id;

  const departments = getDepartments();
  const idx = departments.findIndex(d => d.id === id);

  if (idx === -1) return res.redirect('/departments');

  if (!nome) {
    return res.status(400).render('departmentForm', {
      user: req.user, dep: departments[idx], error: 'Nome é obrigatório.'
    });
  }

  departments[idx].nome = nome.trim();
  saveDepartments(departments);

  res.redirect('/departments');
});

// EXCLUIR
router.post('/departments/:id/delete', authRequired, adminOnly, (req, res) => {
  const id = req.params.id;
  const departments = getDepartments().filter(d => d.id !== id);
  saveDepartments(departments);
  res.redirect('/departments');
});

module.exports = router;