// src/services/powerbiExportService.js
const axios = require('axios');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function logAxiosError(prefix, err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const requestId = err?.response?.headers?.requestid;

  console.error(prefix, {
    status,
    requestId,
    data: data ? JSON.stringify(data, null, 2) : null
  });
}

async function exportReportToFile({ groupId, reportId, accessToken, format = 'PNG' }) {
  const base = 'https://api.powerbi.com/v1.0/myorg';
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  let exportId;

  // 1) dispara export job
  try {
    const exportResp = await axios.post(
      `${base}/groups/${groupId}/reports/${reportId}/ExportTo`,
      { format },
      { headers }
    );
    exportId = exportResp.data.id;
  } catch (err) {
    logAxiosError('EXPORT START ERROR:', err);
    throw err;
  }

  // 2) polling status
  let status = 'Running';
  try {
    for (let i = 0; i < 30; i++) {
      await sleep(2000);

      const s = await axios.get(
        `${base}/groups/${groupId}/reports/${reportId}/exports/${exportId}`,
        { headers }
      );

      status = s.data.status;

      if (status === 'Succeeded') break;
      if (status === 'Failed') {
        throw new Error(`Export failed: ${JSON.stringify(s.data, null, 2)}`);
      }
    }
  } catch (err) {
    logAxiosError('EXPORT STATUS ERROR:', err);
    throw err;
  }

  if (status !== 'Succeeded') {
    throw new Error(`Export timeout. Last status=${status}`);
  }

  // 3) baixa arquivo
  try {
    const fileResp = await axios.get(
      `${base}/groups/${groupId}/reports/${reportId}/exports/${exportId}/file`,
      { headers, responseType: 'arraybuffer' }
    );

    return Buffer.from(fileResp.data);
  } catch (err) {
    logAxiosError('EXPORT FILE ERROR:', err);
    throw err;
  }
}

module.exports = { exportReportToFile };
