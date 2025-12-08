// src/routes/powerbiRoutes.js
const express = require('express');
const { authRequired } = require('../middlewares/authMiddleware');
const { getEmbedConfigForModule } = require('../services/powerbiService');

const router = express.Router();

router.get('/api/powerbi/embed-config', authRequired, async (req, res) => {
  try {
    const rawModule = req.query.module || 'GDR';
    const requestedModule = rawModule.toUpperCase();

    // permissões do usuário (flags do JSON)
    const userReports = (req.user.relatorios || []).map(r => r.toUpperCase());

    if (!userReports.includes(requestedModule)) {
      return res.status(403).json({
        error: 'Você não tem acesso a este relatório.'
      });
    }

    const { module, reportInfo, embedToken } =
      await getEmbedConfigForModule(requestedModule);

    res.json({
      module,
      reportId: reportInfo.id,
      embedUrl: reportInfo.embedUrl,
      accessToken: embedToken.token,
      expiresOn: embedToken.expiration,
      user: req.user
    });
  } catch (err) {
    console.error('Erro ao gerar embed config:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao gerar embed config do Power BI.' });
  }
});

module.exports = router;