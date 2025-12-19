const crypto = require('crypto');

function generateResetToken() {
  // 16 bytes = 32 chars hex, suficiente e simples
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

module.exports = { generateResetToken };