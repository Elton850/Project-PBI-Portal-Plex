// src/cli/addUser.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersPath = path.join(__dirname, '..', 'data', 'users.json');

async function run() {
  const [email, senha, departamento, ...nomeParts] = process.argv.slice(2);
  const nome = nomeParts.join(' ');

  if (!email || !senha || !departamento || !nome) {
    console.log('Uso: node src/cli/addUser.js email senha departamento "Nome Completo"');
    process.exit(1);
  }

  const users = fs.existsSync(usersPath)
    ? JSON.parse(fs.readFileSync(usersPath, 'utf8'))
    : [];

  // verifica duplicado
  if (users.find(u => u.email === email)) {
    console.log('Erro: usuário já existe.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(senha, 10);

  const newUser = {
    email,
    nome,
    passwordHash,
    departamento
  };

  users.push(newUser);

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  console.log('Usuário criado com sucesso:');
  console.log(newUser);
}

run();
