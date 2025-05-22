require('dotenv').config({ path: '../.env' });
const fileListener = require('./file-listener');
const pgClient = require('./node_modules/pg');

const formidable = require('formidable');
const range = require('express-range');
const archiver = require('archiver');
const fsp = require('fs').promises;
const express = require('express');
const sharp = require('sharp');
const path = require('path');
const cors = require('cors');
const zip = require('adm-zip');
const fs = require('fs');

const session = require('express-session');
const route = express();

const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'mkv'];
const imageTypes = ['jpg', 'jpeg', 'png', 'gif'];
const audioTypes = ['mp3', 'wav', 'ogg'];

const maxSessionAge = 1000 * 60 * 30; // 30 minutes
const maxUploadSize = 1024 * 1024 * 1024; // 1 GB
const maxSingleFileSize = 1024 * 1024 * 50; // 50 MB
const maxFileNameLength = 100; // 100 characters

route.use(express.json());
route.use(cors({
  exposedHeaders: ['X-Total-Size'],
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
    return result.send({ message: 'Authentication Failed', success: false });
  
  } next();
};

route.post('/api/authenticate', (request, result) => {
  if (Buffer.from(request.body.authorization, 'base64').toString('ascii') != process.env.PASSWORD) {
    return result.send({ message: 'Incorrect Password. Try again.', success: false });
  }

  const user_data = request.body.user_data;
  if (user_data) {
    const database = new pgClient.Client(
      `postgres://${process.env.DB_USER}:` +
      `${process.env.DB_PASSWORD}@` +
      `${process.env.DB_SERVER}:${process.env.DB_PORT}/` +
      `${process.env.DB_NAME}`
    );

    database.connect();
    database.query(`
      INSERT INTO filehub_logins
      (user_agent, ip_address, country, region, city, postal_code, date_created)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7)

    `, [
      user_data.user_agent,
      user_data.ip_address,
      user_data.country,
      user_data.region,
      user_data.city,
      user_data.postal_code,
      new Date(),
    
    ], () => database.end());
  }

  request.session.authenticated = true;
  request.session.save(_ => {
    result.send({
      cookie: request.headers.cookie,
      age: maxSessionAge / 1000,
      success: true,
    });
  });
});

route.post('/api/file', middleware, (request, result) => {
  const fileName = `${request.body.file_name}.${request.body.file_extension}`;

  fs.readFile(`files/${fileName}`, (error, data) => {
    if (error) return result.send({ message: 'Failed retrieving file. Refresh your page and try again', success: false });
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
  const limit = request.body.limit;
  let lastFileName = request.body.lastFileName;

  let localFiles = [];
  let totalSize = 0;
  let fileId = 0;

  fs.readdir('files', (_, files) => {
    files.sort((a, b) => a.localeCompare(b));
    files.forEach(fileName => {
      const fileNameWithoutExtension = fileName.split('.').slice(0, -1).join('.');
      const size = fs.statSync(`files/${fileName}`).size;

      totalSize += size;
      if (limit == fileId) return;

      if (lastFileName && lastFileName != fileNameWithoutExtension) return;
        else {
          if (lastFileName) {
            lastFileName = null;
            return;
          }
        }

      const extension = fileName.split('.').pop().toLowerCase();
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

    result.send({
      files: localFiles,
      count: files.length,
      size_in_bytes: totalSize,
    });
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
  const form = new formidable.IncomingForm({
    maxFileSize: maxUploadSize,
    allowEmptyFiles: true,
    minFileSize: 0,
  });

  const safeSend = (statusObj) => {
    if (!responded) {
      responded = true;
      result.status(400).send(statusObj);
    }
  };

  let responded = false;
  let files = [];

  form.on('file', (field, file) => {
    files.push([field, file]);
  });
  
  form.on('end', async () => {
    if (responded) return;

    const fileIssuesMap = new Map();
    files.forEach(file => {
      const originalName = file[1].originalFilename;
      const size = file[1].size;
      const reasons = [];

      if (originalName.length > maxFileNameLength) {
        reasons.push(`Name is too long. Maximum: ${maxFileNameLength} characters`);
      }

      if (size > maxSingleFileSize) {
        reasons.push(`File size exceeded. Maximum: ${maxSingleFileSize / 1024 / 1024} MB`);
      }

      if (reasons.length > 0) {
        if (!fileIssuesMap.has(originalName)) {
          fileIssuesMap.set(originalName, { name: originalName, size, reasons });
        } else {
          fileIssuesMap.get(originalName).reasons.push(...reasons);
        }
      }
    });

    const notUploaded = Array.from(fileIssuesMap.values());
    const invalidNames = new Set(notUploaded.map(f => f.name));
    files = files.filter(file => !invalidNames.has(file[1].originalFilename));

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
    result.send({
      success: true,
      not_uploaded: notUploaded,
      message: 'File upload successful',
    });
  });

  form.parse(request, (error) => {
    if (error) {
      if (error.code == 1009) {
        return safeSend({
          success: false,
          message: `File size exceeded. Please upload files of a combined size less than ${maxUploadSize / 1024 / 1024} MB`,
        });
      }

      return safeSend({
        success: false,
        message: 'File upload failed. Please try again.',
      });
    }
  });
});

route.post('/api/export', middleware, (request, result) => {
  const directoryPath = path.join(__dirname, 'files');
  const files = fs.readdirSync(directoryPath);
  let totalSize = 0;

  files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    try {
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    } catch {
      // if file is missing or unreadable, skip it
    }
  });

  result.setHeader('Content-Type', 'application/zip');
  result.setHeader('Content-Disposition', 'attachment; filename="export.zip"');
  result.setHeader('X-Total-Size', totalSize);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', () => {
    // file fails to read due to being missing or locked
  });

  archive.pipe(result);
  files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    try {
      archive.file(filePath, { name: file });
    } catch {
      // skip file if it can't be added (missing or locked)
    }
  });

  archive.finalize();
});

// PRIMARILY USED FOR MOBILE DEVICES
// QUICK AND EASY DOWNLOAD WITHOUT EFFECTS
route.get('/api/export-direct', middleware, (request, result) => {
  const directoryPath = path.join(__dirname, 'files');
  const files = fs.readdirSync(directoryPath);
  let totalSize = 0;

  files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      totalSize += stats.size;
    }
  });

  result.setHeader('Content-Type', 'application/zip');
  result.setHeader('Content-Disposition', 'attachment; filename="export.zip"');

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(result);

  files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    archive.file(filePath, { name: file });
  });

  archive.finalize();
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

    if (fs.existsSync(`files/${fileName}`)) {
      fs.unlinkSync(`files/${fileName}`);
    }

    if (fs.existsSync(`thumbnails/${fileName}`)) {
      fs.unlinkSync(`thumbnails/${fileName}`);
    }
  });

  fileListener.synchronize_files();
  result.send({
    message: 'Deleted File',
    success: true,
  });
});

route.post('/api/delete-all', middleware, async (request, result) => {
  const fileFolder = 'files';
  const thumbnailFolder = 'thumbnails';

  try {
    const files = await fsp.readdir(fileFolder);
    const thumbnails = await fsp.readdir(thumbnailFolder);

    for (const file of files) {
      const filePath = path.join(fileFolder, file);

      try {
        const stat = await fsp.stat(filePath);
        if (stat.isFile()) {
          await fsp.unlink(filePath);
        }

      } catch (_) {
        // silently skip
      }
    }

    for (const thumbnail of thumbnails) {
      const thumbPath = path.join(thumbnailFolder, thumbnail);

      try {
        const stat = await fsp.stat(thumbPath);
        if (stat.isFile()) {
          await fsp.unlink(thumbPath);
        }
      } catch (_) {
        // silently skip
      }
    }

    fileListener.synchronize_files();
    result.send({
      message: 'All files and thumbnails deleted successfully',
      success: true,
    });

  } catch (_) {
    result.send({
      message: 'Error deleting files/thumbnails. Refresh the page and try again.',
      success: false,
    });
  }
});

route.listen(process.env.SERVER_PORT, () => {
  console.log(`API Listening on Port ${process.env.SERVER_PORT}`);
});