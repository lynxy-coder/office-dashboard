import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

import { EQUIPMENT } from '../public/js/equipment.js';
import { createEmulator } from '../public/js/emulator.js';

const PORT = process.env.PORT || 3000;
const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const emulator = createEmulator(EQUIPMENT);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/equipment') {
    res.writeHead(200, { 'Content-Type': TYPES['.json'] });
    return res.end(JSON.stringify(EQUIPMENT));
  }

  const file = path.join(PUBLIC, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(PUBLIC + path.sep)) {
    res.writeHead(403);
    return res.end();
  }

  try {
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'text/plain' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (socket) => {
  socket.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'fault') emulator.toggleFault(msg.id);
      if (msg.type === 'mode') emulator.setMode(msg.id, msg.mode);
    } catch {
      // кривое сообщение, игнорируем
    }
  });
});

setInterval(() => {
  const message = JSON.stringify({ type: 'telemetry', ts: Date.now(), items: emulator.tick() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
}, 1000);

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
