// src/services/telegramService.js
const axios = require('axios');
const FormData = require('form-data');

async function sendDocumentToTelegram({ botToken, chatId, fileBuffer, filename, caption }) {
  const url = `https://api.telegram.org/bot${botToken}/sendDocument`;

  const form = new FormData();
  form.append('chat_id', chatId);
  if (caption) form.append('caption', caption);
  form.append('document', fileBuffer, { filename });

  const resp = await axios.post(url, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  });

  return resp.data;
}

module.exports = { sendDocumentToTelegram };