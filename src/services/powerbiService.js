const axios = require('axios');
const { tenantId, clientId, clientSecret, pbiReports } = require('../config/powerbiConfig');

async function getAccessToken() {
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', 'https://analysis.windows.net/powerbi/api/.default');

  const resp = await axios.post(url, params);
  return resp.data.access_token;
}

// Pega config do módulo (PLEX, GDR, UGB...)
function getReportConfig(moduleKey) {
  const key = moduleKey && pbiReports[moduleKey] ? moduleKey : 'GDR';
  return { module: key, ...pbiReports[key] };
}

// Gera embed info (report + token) para um módulo
async function getEmbedConfigForModule(moduleKey) {
  const { workspaceId, reportId, module } = getReportConfig(moduleKey);
  const accessToken = await getAccessToken();

  // informações do report
  const reportUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`;
  const reportResp = await axios.get(reportUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  // embed token
  const tokenUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`;
  const payload = { accessLevel: 'View' };

  const tokenResp = await axios.post(tokenUrl, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  return {
    module,
    reportInfo: reportResp.data,
    embedToken: tokenResp.data
  };
}

module.exports = {
  getEmbedConfigForModule
};