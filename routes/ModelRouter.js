const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs=require('fs')
const path=require('path')
const mongoose = require('mongoose');
const Model = require("../models/model");
const mongoURI= "mongodb+srv://traz08102003:G1XMVWTucFqfpNch@cp17303.4gzmzyt.mongodb.net/giapha?retryWrites=true&w=majority"
const conn = mongoose.createConnection(mongoURI);
const { GridFSBucket } = mongoose.mongo;
const { Readable } = require('stream');
// Init gfs
let gfsBucket;

conn.once('open', () => {
  gfsBucket = new GridFSBucket(conn.db, {
    bucketName: 'uploads',
  });
});

// Create storage engine
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/readfiles', async (req, res) => {
  const directoryPath = req.body.path; // Đường dẫn thư mục từ query parameter

  if (!directoryPath) {
    return res.status(400).json({ message: 'Thiếu đường dẫn thư mục.' });
  }

  try {
    // Đọc danh sách các file trong thư mục
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        return res.status(500).json({ message: 'Lỗi khi đọc thư mục.', error: err.message });
      }

      // Đọc nội dung từng file
      const fileContents = files.map((file) => {
        const filePath = path.join(directoryPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        return { fileName: file, content: content };
      });

      res.json(fileContents);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi đọc các tệp.' });
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
          const name = nameMatch[1].replace(/\\/g, '').trim();
          const duplicate = await Model.findOne({ name });
          if (!duplicate) {
            uniqueFiles.push(uploadedFile);
          }
          resolve();
        });

        readableStream.on('error', reject);
      });
    }

    // Lưu các file không trùng nội dung vào MongoDB GridFS và đẩy chúng lên
    for (const uniqueFile of uniqueFiles) {
      const readableStream = Readable.from(uniqueFile.buffer);
      const uploadStream = gfsBucket.openUploadStream(uniqueFile.originalname);

      readableStream.pipe(uploadStream);

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', async () => {
          const fileContent = uniqueFile.buffer.toString('utf8');
          const nameMatch = fileContent.match(/name=(.*)/);

          if (!nameMatch) {
            return res.status(400).json({ message: 'Tệp tin không chứa trường name hợp lệ.' });
          }

          const name = nameMatch[1].replace(/\\/g, '').trim();
          const newModel = new Model({ name });
          await newModel.save();
          newModels.push(newModel);

          resolve();
        });

        uploadStream.on('error', reject);
      });
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
