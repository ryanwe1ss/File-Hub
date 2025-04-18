const express = require('express');
const webSocket = require('ws');
const http = require('http');

const listenerApi = express();
const wss = new webSocket.Server({ noServer: true });
const httpServer = http.createServer(listenerApi);

function synchronize_files() {
  wss.clients.forEach(client => {
    if (client.readyState === webSocket.OPEN) {
      client.send(JSON.stringify({
        action: 'synchronize_files',
      }));
    }
  });
}

wss.on('connection', (socket) => {
  socket.on('close', () => {
    wss.clients.delete(socket);
  });
});

httpServer.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit('connection', socket, request);
  });
});

httpServer.listen(process.env.FILE_LISTENER_PORT, () => {
  console.log(`File Listener on Port ${process.env.FILE_LISTENER_PORT}`);
});

module.exports = {
  synchronize_files,
};