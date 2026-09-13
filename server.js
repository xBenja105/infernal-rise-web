const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);
  if (pathname === '/') pathname = '/index.html';

  const fullPath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Acceso denegado');
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Archivo no encontrado');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Error del servidor');
      }
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Infernal Rise Web Server iniciado en http://localhost:${PORT}/`);
});
