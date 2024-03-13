require('dotenv').config({ path: '../.env' });
const fileListener = require('./file-listener');

const formidable = require('formidable');
const range = require('express-range');
const express = require('express');
const sharp = require('sharp');
const cors = require('cors');
const zip = require('adm-zip');
const fs = require('fs');

const route = express();
const imageTypes = ['jpg', 'jpeg', 'png', 'gif'];

route.use(range({ accept: 'bytes' }));
route.use(express.json());
route.use(cors());

const middleware = (request, result, next) => {
  if (Buffer.from(request.headers.authorization, 'base64').toString('ascii') != process.env.PASSWORD) {
    return result.sendStatus(401);
  
  } next();
};

route.get('/api/authenticate', (request, result) => {
  result.sendStatus(
    Buffer.from(request.headers.authorization, 'base64').toString('ascii') !=
    process.env.PASSWORD
      ? 401
      : 200
    );
});

route.get('/api/file', middleware, (request, result) => {
  const fileName = request.headers['file-name'];

  fs.readFile(`files/${fileName}`, (error, data) => {
    if (error) return result.sendStatus(404);
    result.send(data);
  });
});

route.get('/api/files', middleware, (request, result) => {
  const searchQuery = request.query.name.toLowerCase();
  const limit = request.query.limit;
  const localFiles = [];
  let fileId = 1;

  fs.readdir('files', (error, files) => {
    files.forEach(fileName => {
      if (searchQuery && !fileName.toLowerCase().includes(searchQuery) || limit == fileId - 1) return;

      const extension = fileName.split('.').pop().toLowerCase();
      const size = fs.statSync(`files/${fileName}`).size;
      const date = fs.statSync(`files/${fileName}`).mtime;
      let thumbnail = null;

      if (imageTypes.some(type => type != extension) && fs.existsSync(`thumbnails/${fileName}`)) {
        thumbnail = `data:image/${extension};base64,${fs.readFileSync(`thumbnails/${fileName}`, { encoding: 'base64' })}`;
      }

      localFiles.push({
        id: fileId,
        name: fileName,
        thumbnail: thumbnail,
        type: extension,
        size: size,
        date: date,
      });

      fileId++;
    });

    result.send({ files: localFiles, count: files.length });
  });
});

route.post('/api/download', (request, result) => {
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

  setTimeout(() => {
    if (fs.existsSync('files.zip')) {
      fs.unlinkSync('files.zip');
    }
  }, 1000);
});

route.post('/api/upload', middleware, (request, result) => {
  const files = [];
  const form = new formidable.IncomingForm();

  form.on('error', () => {
    response.status(500);
  });

  form.on('file', (field, file) => {
    files.push([field, file]);
  });
  
  form.on('end', async () => {
    // wait for all file writing tasks to complete
    const fileWriting = files.map((file) => {
      return new Promise((resolve) => {
        fs.rename(
          file[1].filepath,
          `files/${file[1].originalFilename}`,
          (error) => resolve()
        );
      });
    });
    await Promise.all(fileWriting);
  
    // wait for all thumbnail generation tasks to complete
    const thumbnailWriting = files.map((thumbnail) => {
      return new Promise((resolve) => {
        sharp(`files/${thumbnail[1].originalFilename}`)
          .resize(100, 100)
          .rotate()
          .toFile(`thumbnails/${thumbnail[1].originalFilename}`, (error) => resolve());
      });
    });
    await Promise.all(thumbnailWriting);

    fileListener.synchronize();
    result.sendStatus(200);
  });

  form.parse(request);
});

route.delete('/api/delete', middleware, (request, result) => {
  const files = request.body;

  files.forEach(file => {
    fs.unlinkSync(`files/${file.name}`);
    if (fs.existsSync(`thumbnails/${file.name}`)) {
      fs.unlinkSync(`thumbnails/${file.name}`);
    }
  });

  fileListener.synchronize();
  result.sendStatus(200);
});

route.listen(process.env.SERVER_PORT, () => {
  console.log(`Server Listening on Port ${process.env.SERVER_PORT}`);
});