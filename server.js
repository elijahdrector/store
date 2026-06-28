const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const ADMIN_PASSWORD = 'Elijahiscool12!';

function loadProducts() {
  try { return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8')); }
  catch { return []; }
}

function saveProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 50 * 1024 * 1024) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type,X-Admin-Password' });
    return res.end();
  }

  if (url === '/api/products' && req.method === 'GET') {
    return json(res, loadProducts());
  }

  if (url === '/api/admin/products' && req.method === 'POST') {
    if (req.headers['x-admin-password'] !== ADMIN_PASSWORD) return json(res, { error: 'Unauthorized' }, 401);
    const body = await parseBody(req);
    if (!Array.isArray(body)) return json(res, { error: 'Invalid data' }, 400);
    saveProducts(body);
    return json(res, { ok: true });
  }

  if (url === '/admin') {
    const file = path.join(__dirname, 'admin.html');
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(500); return res.end('Error loading page'); }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
