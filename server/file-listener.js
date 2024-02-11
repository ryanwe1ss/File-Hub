const webSocket = require('ws');
const fs = require('fs');

const wss = new webSocket.Server({ port: process.env.FILE_LISTENER_PORT });
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