const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'activities.json')
  : path.join(__dirname, 'activities.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.css':  'text/css',
};

function loadActivities() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function saveActivities(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // GET /activities
  if (req.method === 'GET' && req.url === '/activities') {
    const list = loadActivities();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }

  // POST /activities
  if (req.method === 'POST' && req.url === '/activities') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const activity = JSON.parse(body);
        activity.id = Date.now();
        const list = loadActivities();
        list.unshift(activity);
        saveActivities(list);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(activity));
      } catch {
        res.writeHead(400); res.end('Bad request');
      }
    });
    return;
  }

  // DELETE /activities/:id
  const deleteMatch = req.url.match(/^\/activities\/(\d+)$/);
  if (req.method === 'DELETE' && deleteMatch) {
    const id = parseInt(deleteMatch[1]);
    const list = loadActivities().filter(a => a.id !== id);
    saveActivities(list);
    res.writeHead(200); res.end('ok');
    return;
  }

  // Static files
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });

}).listen(PORT, () => console.log(`Server running on port ${PORT}`));
