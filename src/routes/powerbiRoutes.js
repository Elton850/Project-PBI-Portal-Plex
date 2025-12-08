const express = require('express');
const { authRequired } = require('../middlewares/authMiddleware');
const { getEmbedConfigForModule } = require('../services/powerbiService');

const router = express.Router();

router.get('/api/powerbi/embed-config', authRequired, async (req, res) => {
  try {
    const { module } = req.query; // PLEX, GDR, UGB
    const { module: resolvedModule, reportInfo, embedToken } =
      await getEmbedConfigForModule(module);

    res.json({
      module: resolvedModule,
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