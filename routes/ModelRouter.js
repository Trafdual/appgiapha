const express = require("express");
const router = express.Router();
const multer = require("multer");
const { google } = require('googleapis');
const Model = require("../models/model");
const path = require('path')

const SCOPES = 
['https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file', 
  'https://www.googleapis.com/auth/drive.readonly'];

  const KEYFILEPATH = path.resolve(__dirname, '../trusty-magnet-424007-d8-5c8a29b5b083.json'); // Thay bằng đường dẫn thực tế đến tệp credentials.json
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

    if (files.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tệp nào trong thư mục.' });
    }

    files.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
    const latestFile = files[0];

    const content = await downloadFile(auth, latestFile.id);

    // Phân tích nội dung theo cấu trúc đã cung cấp
    const lines = content.split('\n').map(line => line.trim());
    const details = {};
    
    for (let line of lines) {
      if (line.startsWith('Device Model11111')) {
        details.name = line.split(/\s{2,}/)[1].trim();
      } else if (line.startsWith('Device Color')) {
        details.color = line.replace(/[^\w\s]/g, '-').split(/\s{2,}/)[1].trim();
      } else if (line.startsWith('Hard Disk Capacity')) {
        details.dungluong = line.split(/\s{2,}/)[1].trim();
      } else if (line.startsWith('Serial Number')) {
        details.imel = line.split(/\s{2,}/)[1].trim();
      } 
    }

    const model = new Model(details);
    await model.save();
    res.redirect('/hi');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi đọc các tệp.', error: error.message });
  }
});

router.post('/posttest',async(req,res)=>{
  try {
    const {imel}=req.body;
    const model =new Model({imel});
    await model.save();
    res.json({message:'them thanh cong'})
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Đã xảy ra lỗi.', error: error.message });
  }
})

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
  try {
    const model= await Model.find().lean();
    res.render("hi",{model});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi thêm giấc mộng mới." });
  }
});
module.exports = router;
