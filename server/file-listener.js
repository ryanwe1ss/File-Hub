const express = require('express');
const webSocket = require('ws');
const http = require('http');
const fs = require('fs');

const wss = new webSocket.Server({ noServer: true });
const listenerApi = express();
const httpServer = http.createServer(listenerApi);

function synchronize() {
  const files = fs.readdirSync('files');

  wss.clients.forEach(client => {
    if (client.readyState === webSocket.OPEN) {
      client.send(files.length);
    }
  });
}

httpServer.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit('connection', socket, request);
  });
});

httpServer.listen(process.env.FILE_LISTENER_PORT, () => {
  console.log(`File Listener on Port ${process.env.FILE_LISTENER_PORT}`);
});

module.exports = { synchronize };