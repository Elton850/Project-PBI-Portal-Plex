// src/routes/telegramRoutes.js
const express = require('express');
const { authRequired } = require('../middlewares/authMiddleware');

const { exportReportToFile } = require('../services/powerbiExportService');
const { sendDocumentToTelegram } = require('../services/telegramService');

const { getAccessToken } = require('../services/powerbiService');

const router = express.Router();

function getModuleConfig(moduleKey) {
  const m = (moduleKey || 'GDR').toUpperCase();
  if (m === 'PLEX') return { groupId: process.env.PBI_WS_PLEX, reportId: process.env.PBI_REPORT_PLEX };
  if (m === 'UGB')  return { groupId: process.env.PBI_WS_UGB,  reportId: process.env.PBI_REPORT_UGB };
  return { groupId: process.env.PBI_WS_GDR, reportId: process.env.PBI_REPORT_GDR };
}

// GET só para teste no navegador: /api/telegram/send-report?module=GDR
router.get('/api/telegram/send-report', authRequired, async (req, res) => {
  try {
    const module = (req.query.module || 'GDR').toUpperCase();
    const { groupId, reportId } = getModuleConfig(module);

    const accessToken = await getAccessToken();

    const fileBuffer = await exportReportToFile({
      groupId,
      reportId,
      accessToken,
      format: 'PNG'
    });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    await sendDocumentToTelegram({
      botToken,
      chatId,
      fileBuffer,
      filename: `PBI_${module}.png`,
      caption: `Relatório ${module} (enviado por ${req.user.email})`
    });

    return res.send('OK: enviado para o Telegram.');
  } catch (err) {
    console.error('Telegram export error:', err);
    return res.status(500).send('Falha ao exportar/enviar.');
  }
});

// POST (usado pelo botão)
router.post('/api/telegram/send-report', authRequired, async (req, res) => {
  try {
    const module = ((req.body && req.body.module) || 'GDR').toUpperCase();
    const { groupId, reportId } = getModuleConfig(module);

    const accessToken = await getAccessToken();

    const fileBuffer = await exportReportToFile({
      groupId,
      reportId,
      accessToken,
      format: 'PNG'
    });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    await sendDocumentToTelegram({
      botToken,
      chatId,
      fileBuffer,
      filename: `PBI_${module}.png`,
      caption: `Relatório ${module} (enviado por ${req.user.email})`
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Telegram export error:', err);
    return res.status(500).json({ ok: false, error: 'Falha ao exportar/enviar.' });
  }
});

module.exports = router;