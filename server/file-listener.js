const express = require('express');
const webSocket = require('ws');
const http = require('http');
const fs = require('fs');

const wss = new webSocket.Server({ noServer: true });
const listenerApi = express();
const httpServer = http.createServer(listenerApi);

const fileFolder = 'files/';
let alteredFiles = new Set();

wss.on('connection', (ws) => {
  fs.watch(fileFolder, (event, fileName) => {
    alteredFiles.add(fileName);
    
    setTimeout(() => {
      const numberOfFilesChanged = alteredFiles.size;
      let message = null;

      if (numberOfFilesChanged > 1) {
        message = 'Multiple File Changes Detected';

      } else if (numberOfFilesChanged == 1) {
        message = 'Single File Change Detected';
      }

      if (message) {
        wss.clients.forEach(client => {
          if (client.readyState === webSocket.OPEN) {
            client.send(message);
          }
        });
      
      } alteredFiles.clear();

    }, 100);
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