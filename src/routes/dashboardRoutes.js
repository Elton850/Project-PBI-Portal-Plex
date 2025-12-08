// src/routes/dashboardRoutes.js
const express = require('express');
const { authRequired } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/dashboard', authRequired, (req, res) => {
  res.render('dashboard', {
    user: req.user
  });
});

module.exports = router;