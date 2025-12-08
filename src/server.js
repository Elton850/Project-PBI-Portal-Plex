// src/server.js
const app = require('./app');
const { port } = require('./config/powerbiConfig');

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});