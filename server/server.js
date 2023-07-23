require('dotenv').config({ path: '../.env' });

const formidable = require('formidable');
const range = require('express-range');
const express = require('express');
const sharp = require('sharp');
const cors = require('cors');
const zip = require('adm-zip');
const fs = require('fs');

const route = express();
route.use(range({ accept: 'bytes' }));
route.use(express.json());
route.use(cors());

route.get('/api/files', (request, result) => {
  const searchQuery = request.query.name;
  const limit = request.query.limit;

  const localFiles = [];
  let fileId = 1;

  fs.readdir('files', (error, files) => {
    const count = files.length;

    files.forEach(file => {
      if (searchQuery && !file.includes(searchQuery) || limit == fileId - 1) return;

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
        id: fileId,
        name: file,
        thumbnail: fileThumbnail,
        type: fileExtension,
        size: fileSize,
        date: fileDate,
      });

      fileId++;
    });

    result.send({ files: localFiles, count: count });
  });
});

route.post('/api/download', (request, result) => {
  const files = request.body;
  const zipFile = new zip();

  if (files.length == 1) {
    result.download(`files/${files[0].name}`);

  } else {
    const fileSize = fs.statSync('files.zip').size;
    const stream = fs.createReadStream('files.zip', { highWaterMark: 64 * 1024 });

    files.forEach(file => {
      zipFile.addLocalFile(`files/${file.name}`);
    
    }); zipFile.writeZip('files.zip');

    result.setHeader('Content-Length', fileSize);
    result.range({
      first: 0,
      last: fileSize - 1,
      length: fileSize,
    });

    stream.on('data', (chunk) => {
      result.write(chunk);
    });
    
    stream.on('end', () => {
      result.end();
      fs.unlinkSync('files.zip');
    });
  }
});

route.post('/api/upload', (request, result) => {
  
  const form = new formidable.IncomingForm({
    maxFileSize: Infinity,
    maxFieldsSize: Infinity,
  });
  const files = [];

  form.on('file', (field, file) => {
    files.push([field, file]);
  });
  
  form.on('end', async () => {
    // Wait for all file writing tasks to complete
    const fileWritingPromises = files.map((file) => {
      return new Promise((resolve) => {
        fs.rename(
          file[1].filepath,
          `files/${file[1].originalFilename}`,
          (error) => resolve()
        );
      });
    });
    await Promise.all(fileWritingPromises);
  
    // Wait for all thumbnail generation tasks to complete
    const thumbnailPromises = files.map((thumbnail) => {
      return new Promise((resolve) => {
        sharp(`files/${thumbnail[1].originalFilename}`)
          .resize(100, 100)
          .toFile(`thumbnails/${thumbnail[1].originalFilename}`, (error) => resolve());
      });
    });
    await Promise.all(thumbnailPromises);
  
    // Send the response once all tasks are completed
    result.sendStatus(200);
  });
  
  form.parse(request);
});

route.delete('/api/delete', (request, result) => {
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