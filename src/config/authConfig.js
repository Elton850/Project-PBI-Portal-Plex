// src/config/authConfig.js
const path = require('path');
const fs = require('fs');

const usersPath = path.join(__dirname, '..', 'data', 'users.json');

function getUsers() {
  if (!fs.existsSync(usersPath)) return [];
  return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

module.exports = {
  getUsers,
  saveUsers
};
