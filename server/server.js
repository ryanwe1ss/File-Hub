require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const zip = require('adm-zip');
const fs = require('fs');
const route = express();

route.use(cors());
route.use(express.json());

route.get('/files', (request, result) => {
  const localFiles = [];

  fs.readdir('files', (error, files) => {
    files.forEach(file => {
      const fileExtension = file.split('.').pop();
      const fileSize = fs.statSync(`files/${file}`).size;
      const fileDate = fs.statSync(`files/${file}`).mtime;

      let fileThumbnail = null;
      if (fileExtension === 'jpg' || fileExtension === 'png') {
        if (fs.existsSync(`thumbnails/${file}`)) {
          fileThumbnail = `data:image/${fileExtension};base64,${fs.readFileSync(`thumbnails/${file}`, { encoding: 'base64' })}`;
        }
      }

      localFiles.push({
        name: file,
        thumbnail: fileThumbnail,
        type: fileExtension,
        size: fileSize,
        date: fileDate,
      });
    });

    result.send(localFiles);
  });
});

route.post('/download', (request, result) => {
  const files = request.body;
  const zipFile = new zip();

  if (files.length == 1) {
    result.download(`files/${files[0].name}`);
  
  } else {
    files.forEach(file => {
      zipFile.addLocalFile(`files/${file.name}`);
    });
  
    zipFile.writeZip('files.zip');
    result.download('files.zip');
  }
});

route.delete('/delete', (request, result) => {
  const files = request.body;

  files.forEach(file => {
    fs.unlinkSync(`files/${file.name}`);
    if (fs.existsSync(`thumbnails/${file.name}`)) {
      fs.unlinkSync(`thumbnails/${file.name}`);
    }
  });

  result.sendStatus(200);
});

route.listen(process.env.SERVER_PORT, () => {
  console.log(`Server listening on port ${process.env.SERVER_PORT}`);
});