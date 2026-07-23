const { serviceRoleRequest } = require('./admin-auth');
const writeXlsxFile = require('write-excel-file/node');

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

const normalizeSpreadsheetText = (value) => String(value ?? '').replace(/\r?\n/g, ' ').trim();

const getColumnWidth = (header, values, { min = 12, max = 48 } = {}) => {
  const longest = Math.max(header.length, ...values.map((value) => normalizeSpreadsheetText(value).length));
  return Math.min(Math.max(longest + 2, min), max);
};

const createXlsx = async (rows) => {
  const headers = ['Nome', 'E-mail', 'WhatsApp', 'Data de cadastro'];
  const headerStyle = {
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#0B6E99',
    align: 'center',
    height: 24
  };
  const textCell = (value) => ({
    value: normalizeSpreadsheetText(value),
    type: String,
    format: '@',
    wrap: false
  });
  const sheetData = [
    headers.map((value) => ({ value, type: String, ...headerStyle })),
    ...rows.map((row) => [
      textCell(row.name),
      textCell(row.email),
      textCell(row.whatsapp),
      {
        value: new Date(row.created_at),
        type: Date,
        format: 'dd/mm/yyyy hh:mm',
        align: 'center'
      }
    ])
  ];
  const columns = [
    { width: getColumnWidth(headers[0], rows.map((row) => row.name), { min: 18 }) },
    { width: getColumnWidth(headers[1], rows.map((row) => row.email), { min: 24 }) },
    { width: getColumnWidth(headers[2], rows.map((row) => row.whatsapp), { min: 18 }) },
    { width: 22 }
  ];

  return writeXlsxFile(sheetData, {
    columns,
    sheet: 'Leads',
    stickyRowsCount: 1
  }).toBuffer();
};

module.exports = { createXlsx, getDashboardData, getExportRows };
