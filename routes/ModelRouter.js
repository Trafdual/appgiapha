const express = require("express");
const router = express.Router();
const multer = require("multer");
const { google } = require('googleapis');
const Model = require("../models/model");
const { Readable } = require('stream');
const puppeteer = require('puppeteer');
const key=require('../trusty-magnet-424007-d8-5c8a29b5b083.json')
// const fs=require('fs')
// const path=require('path')
const axios = require('axios');
// const cheerio = require('cheerio');
// const mongoose = require('mongoose');
// const mongoURI= "mongodb+srv://traz08102003:G1XMVWTucFqfpNch@cp17303.4gzmzyt.mongodb.net/giapha?retryWrites=true&w=majority"
// const conn = mongoose.createConnection(mongoURI);
// const { GridFSBucket } = mongoose.mongo;

// // Init gfs
// let gfsBucket;

// conn.once('open', () => {
//   gfsBucket = new GridFSBucket(conn.db, {
//     bucketName: 'uploads',
//   });
// });


const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const KEYFILEPATH = '/trusty-magnet-424007-d8-5c8a29b5b083.json'; // Thay bằng đường dẫn thực tế đến tệp credentials.json
async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
  });
  return await auth.getClient();
}
const upload = multer();

async function listFilesInFolder(auth, folderId) {
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.list({
    q: `'${folderId}' in parents`,
    fields: 'files(id, name)',
  });
  return res.data.files;
}

async function downloadFile(auth, fileId) {
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
  return new Promise((resolve, reject) => {
    let data = '';
    res.data
      .on('data', chunk => {
        data += chunk;
      })
      .on('end', () => {
        resolve(data);
      })
      .on('error', err => {
        reject(err);
      });
  });
}

router.post('/readfiles', async (req, res) => {
  const folderId = req.body.folderId;

  if (!folderId) {
    return res.status(400).json({ message: 'Thiếu folderId.' });
  }

  try {
    const auth = await authenticate();
    const files = await listFilesInFolder(auth, folderId);

    const fileContents = [];
    for (const file of files) {
      const content = await downloadFile(auth, file.id);
      fileContents.push({ fileName: file.name, content });
    }

    res.json(fileContents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi đọc các tệp.', error: error.message });
  }
});


router.post('/modelpost1', upload.array('files'), async (req, res) => {
  try {
    let uploadedFiles = req.files;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ message: 'Không có tệp nào được tải lên.' });
    }

    const newModels = [];
    const uniqueFiles = []; // Mảng lưu các file không trùng nội dung

    for (const uploadedFile of uploadedFiles) {
      const readableStream = Readable.from(uploadedFile.buffer);
      let fileContent = '';

      readableStream.on('data', (chunk) => {
        fileContent += chunk.toString();
      });

      await new Promise((resolve, reject) => {
        readableStream.on('end', async () => {
          const fileContent = uploadedFile.buffer.toString('utf8');
          const nameMatch = fileContent.match(/name=(.*)/);
          if (nameMatch) {
            const name = nameMatch[1].replace(/\\/g, '').trim();
            const duplicate = await Model.findOne({ name });
            if (!duplicate) {
              uniqueFiles.push(uploadedFile);
            }
          }
          resolve();
        });

        readableStream.on('error', reject);
      });
    }

    // Upload unique files to Google Drive
    for (const uniqueFile of uniqueFiles) {
      const readableStream = Readable.from(uniqueFile.buffer);

      const driveResponse = await drive.files.create({
        requestBody: {
          name: uniqueFile.originalname,
          mimeType: uniqueFile.mimetype,
        },
        media: {
          mimeType: uniqueFile.mimetype,
          body: readableStream,
        },
      });

      const fileContent = uniqueFile.buffer.toString('utf8');
      const nameMatch = fileContent.match(/name=(.*)/);

      if (!nameMatch) {
        return res.status(400).json({ message: 'Tệp tin không chứa trường name hợp lệ.' });
      }

      const name = nameMatch[1].replace(/\\/g, '').trim();
      const newModel = new Model({ name, fileId: driveResponse.data.id }); // Lưu cả fileId từ Google Drive
      await newModel.save();
      newModels.push(newModel);
    }

    res.json(newModels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm giấc mộng mới.' });
  }
});

router.get("/model", async (req, res) => {
  try {
    const model = await Model.find();
    res.json(model);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Đã xảy ra lỗi khi lấy danh sách giấc mộng." });
  }
});

router.post("/putmodel/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const id = req.params.id;
    const model = await Model.findById(id);
    model.name = name;
    await model.save();
    res.json({ message: "sửa thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi thêm giấc mộng mới." });
  }
});
router.post("/deletemodel/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const model = await Model.findByIdAndDelete(id);

    res.json({ message: "xóa thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi thêm giấc mộng mới." });
  }
});
router.get("/hi", async (req, res) => {
  res.render("hi");
});
module.exports = router;
