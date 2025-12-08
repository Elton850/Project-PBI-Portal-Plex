// scripts/hash.js
const bcrypt = require('bcryptjs');

async function run() {
  const senha = '123456'; // mude aqui
  const saltRounds = 10;
  const hash = await bcrypt.hash(senha, saltRounds);
  console.log('Hash gerado:', hash);
}

run();