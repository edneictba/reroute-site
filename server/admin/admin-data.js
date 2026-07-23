const { serviceRoleRequest } = require('./admin-auth');

const getDashboardData = async ({ search = '', page = 1, pageSize = 25 }, fetchImpl = fetch) => {
  const normalizedSearch = String(search).trim().slice(0, 100);
  const normalizedPage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const normalizedPageSize = [10, 25, 50, 100].includes(Number(pageSize)) ? Number(pageSize) : 25;

  try {
    const response = await serviceRoleRequest('/rest/v1/rpc/get_admin_leads_dashboard', {
      method: 'POST',
      body: JSON.stringify({
        p_search: normalizedSearch,
        p_page: normalizedPage,
        p_page_size: normalizedPageSize
      })
    }, fetchImpl);
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
};

const getExportRows = async (fetchImpl = fetch) => {
  try {
    const response = await serviceRoleRequest('/rest/v1/rpc/export_admin_leads', {
      method: 'POST',
      body: '{}'
    }, fetchImpl);
    if (!response.ok) {
      return null;
    }
    const rows = await response.json();
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
};

const protectCsvCell = (value) => {
  let normalized = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  if (/^[=+\-@\t\r]/.test(normalized)) {
    normalized = `'${normalized}`;
  }
  return `"${normalized.replaceAll('"', '""')}"`;
};

const createCsv = (rows) => {
  const header = ['Nome', 'E-mail', 'WhatsApp', 'Data de cadastro'];
  const lines = [header, ...rows.map((row) => [
    row.name,
    row.email,
    row.whatsapp,
    new Date(row.created_at).toISOString()
  ])];
  return `\uFEFF${lines.map((line) => line.map(protectCsvCell).join(',')).join('\r\n')}\r\n`;
};

module.exports = { createCsv, getDashboardData, getExportRows, protectCsvCell };
