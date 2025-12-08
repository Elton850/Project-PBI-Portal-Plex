require('dotenv').config();

const baseConfig = {
  port: process.env.PORT || 3000,
  tenantId: process.env.TENANT_ID,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_mude_isso'
};

// Map de relatórios por módulo
const pbiReports = {
  PLEX: {
    workspaceId: process.env.PBI_WS_PLEX,
    reportId: process.env.PBI_REPORT_PLEX
  },
  GDR: {
    workspaceId: process.env.PBI_WS_GDR,
    reportId: process.env.PBI_REPORT_GDR
  },
  UGB: {
    workspaceId: process.env.PBI_WS_UGB,
    reportId: process.env.PBI_REPORT_UGB
  }
  // se quiser, depois adiciona USERS aqui também
};

module.exports = {
  ...baseConfig,
  pbiReports
};
