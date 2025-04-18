require('dotenv').config({ path: '../.env' });
const fileListener = require('./file-listener');

const formidable = require('formidable');
const range = require('express-range');
const express = require('express');
const sharp = require('sharp');
const cors = require('cors');
const zip = require('adm-zip');
const fs = require('fs');

const session = require('express-session');
const route = express();

const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'mkv'];
const imageTypes = ['jpg', 'jpeg', 'png', 'gif'];
const audioTypes = ['mp3', 'wav', 'ogg'];
const maxSessionAge = 1000 * 60 * 30; // 30 minutes

route.use(range({ accept: 'bytes' }));
route.use(express.json());
route.use(cors({
  origin: process.env.ORIGIN,
  credentials: true,
}));
route.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'token',
  cookie: {
    maxAge: maxSessionAge,
  },
}));

const middleware = (request, result, next) => {
  if (!request.session.authenticated) {
    return result.sendStatus(401);
  
  } next();
};

route.post('/api/authenticate', (request, result) => {
  if (Buffer.from(request.body.authorization, 'base64').toString('ascii') != process.env.PASSWORD) {
    return result.sendStatus(401);
  }

  request.session.authenticated = true;
  request.session.save(_ => {
    result.send({
      'cookie': request.headers.cookie,
      'age': maxSessionAge / 1000,
    });
  });
});

route.post('/api/file', middleware, (request, result) => {
  const fileName = `${request.body.file_name}.${request.body.file_extension}`;

  fs.readFile(`files/${fileName}`, (error, data) => {
    if (error) return result.sendStatus(404);
    if (
      imageTypes.some(type => type == fileName.split('.').pop().toLowerCase()) ||
      audioTypes.some(type => type == fileName.split('.').pop().toLowerCase()) ||
      videoTypes.some(type => type == fileName.split('.').pop().toLowerCase())
    ) {
      return result.send(data);
    }

    const fileContent = data.toString();
    result.send(
      /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(fileContent) ? 'File cannot be displayed because it is not supported' :
      fileContent.length > 20000000 ? 'File content is too large to be displayed' :
      fileContent
    );
  });
});

route.post('/api/files', middleware, (request, result) => {
  const searchQuery = request.body.name.toLowerCase();
  const limit = request.body.limit;
  const localFiles = [];
  let fileId = 1;

  fs.readdir('files', (error, files) => {
    files.forEach(fileName => {
      if (searchQuery && !fileName.toLowerCase().includes(searchQuery) || limit == fileId - 1) return;

      const fileNameWithoutExtension = fileName.split('.').slice(0, -1).join('.');
      const extension = fileName.split('.').pop().toLowerCase();
      const size = fs.statSync(`files/${fileName}`).size;
      const date = fs.statSync(`files/${fileName}`).mtime;
      let thumbnail = null;

      if (imageTypes.some(type => type != extension) && fs.existsSync(`thumbnails/${fileName}`)) {
        thumbnail = `data:image/${extension};base64,${fs.readFileSync(`thumbnails/${fileName}`, { encoding: 'base64' })}`;
      }

      localFiles.push({
        id: fileId,
        name: fileNameWithoutExtension,
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

route.post('/api/download', middleware, (request, result) => {
  const files = request.body;
  const zipFile = new zip();

  if (files.length == 1) {
    result.download(`files/${files[0].name}.${files[0].type}`);
  
  } else {
    files.forEach(file => {
      zipFile.addLocalFile(`files/${file.name}.${file.type}`);
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
  const form = new formidable.IncomingForm({
    allowEmptyFiles: true,
    minFileSize: 0,
  });

  form.on('error', () => {
    result.sendStatus(500);
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

    fileListener.synchronize_files();
    result.sendStatus(200);
  });

  form.parse(request);
});

route.post('/api/rename', middleware, (request, result) => {
  const currentName = request.body.current_name;
  const newName = request.body.new_name;

  const currentFilePath = `files/${currentName}`;
  const newFilePath = `files/${newName}`;

  const currentThumbnailPath = `thumbnails/${currentName}`;
  const newThumbnailPath = `thumbnails/${newName}`;

  if (fs.existsSync(currentFilePath)) {
    fs.renameSync(currentFilePath, newFilePath);
  }

  if (fs.existsSync(currentThumbnailPath)) {
    fs.renameSync(currentThumbnailPath, newThumbnailPath);
  }

  fileListener.synchronize_files();
  result.send({
    'status': 'success',
    'message': 'File renamed successfully',
  });
});

route.post('/api/save', middleware, (request, result) => {
  const body = request.body;

  if (!fs.existsSync(`files/${body.name}.${body.type}`)) {
    return result.send({
      'status': 'error',
      'message': 'File does not exist',
    });
  }

  fs.writeFile(`files/${body.name}.${body.type}`, body.content, (error) => {
    return result.send({
      'status': error ? 'error' : 'success',
      'message': error ? 'File could not be saved' : 'File saved successfully',
    });
  });

  fileListener.synchronize_files();
});

route.post('/api/delete', middleware, (request, result) => {
  const files = request.body;

  files.forEach(file => {
    const fileName = `${file.name}.${file.type}`;

    fs.unlinkSync(`files/${fileName}`);
    if (fs.existsSync(`thumbnails/${fileName}`)) {
      fs.unlinkSync(`thumbnails/${fileName}`);
    }
  });

  fileListener.synchronize_files();
  result.sendStatus(200);
});

route.listen(process.env.SERVER_PORT, () => {
  console.log(`Server Listening on Port ${process.env.SERVER_PORT}`);
});