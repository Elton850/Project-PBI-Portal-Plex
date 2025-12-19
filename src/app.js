// src/app.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const powerbiRoutes = require('./routes/powerbiRoutes');
const usersRoutes = require('./routes/usersRoutes');
const departmentsRoutes = require('./routes/departmentsRoutes');
const telegramRoutes = require('./routes/telegramRoutes');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use(authRoutes);
app.use(dashboardRoutes);
app.use(powerbiRoutes);
app.use(usersRoutes);
app.use(departmentsRoutes);
app.use(telegramRoutes);

// Raiz
app.get('/', (req, res) => {
  res.redirect('/login');
});

module.exports = app;