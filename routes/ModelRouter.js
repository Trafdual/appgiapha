const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Model = require('../models/model');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  });
  const upload = multer({ storage: storage });

// Lấy danh sách tất cả giấc mộng
router.get('/model', async (req, res) => {
    try {
        const model = await Model.find();
        res.json(model);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách giấc mộng.' });
    }
});



// Thêm giấc mộng mới
router.post('/modelpost', upload.single('file'),async (req, res) => {
    try {
const {name}=req.body
        const newmodel = new Model({ name});
        await newmodel.save();

        res.json({message:'thêm thành công'})
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm giấc mộng mới.' });
    }
});

router.post('/modelpost1', upload.array('files'), async (req, res) => {
    try {
      const uploadedFiles = req.files;
  
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ message: 'Không có tệp nào được tải lên.' });
      }
  
      // Đọc tất cả các tệp trong thư mục 'uploads'
      const existingFiles = fs.readdirSync('uploads').map(fileName => {
        const filePath = path.join('uploads', fileName);
        return {
          name: fileName,
          content: fs.readFileSync(filePath, 'utf8')
        };
      });
  
      const newModels = [];
      const uniqueFiles = []; // Mảng lưu các file không trùng nội dung
      for (const uploadedFile of uploadedFiles) {
        const uploadedFilePath = path.join('uploads', uploadedFile.filename);
        const uploadedFileContent = fs.readFileSync(uploadedFilePath, 'utf8');
  
        // Kiểm tra xem nội dung tệp tải lên có trùng với bất kỳ tệp nào đã tồn tại
        const duplicateFile = existingFiles.find(file => file.content === uploadedFileContent);
        if (!duplicateFile) {
          // Nếu không có file trùng nội dung, thêm vào mảng các file không trùng
          uniqueFiles.push(uploadedFile);
        }
      }
  
      // Lưu các file không trùng nội dung vào cơ sở dữ liệu và đẩy chúng lên
      for (const uniqueFile of uniqueFiles) {
        const filePath = uniqueFile.path;
        const fileContent = fs.readFileSync(filePath, 'utf8');
        // Giả định rằng tệp tin có cấu trúc "name=value"
        const nameMatch = fileContent.match(/name=(.*)/);
        if (!nameMatch) {
          return res.status(400).json({ message: 'Tệp tin không chứa trường name hợp lệ.' });
        }
        const name = nameMatch[1].replace(/\\/g, '').trim();
        const newModel = new Model({ name });
        await newModel.save();
        newModels.push(newModel);
      }
  
      res.json(newModels);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm giấc mộng mới.' });
    }})

router.post('/putmodel/:id',async(req,res)=>{
    try {
        const {name}=req.body;
        const id=req.params.id;
        const model= await Model.findById(id);
        model.name=name;
        await model.save();
        res.json({message:'sửa thành công'})
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm giấc mộng mới.' });
    }
})
router.post('/deletemodel/:id',async(req,res)=>{
    try {
        const id=req.params.id;
        const model= await Model.findByIdAndDelete(id);

        res.json({message:'xóa thành công'})
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm giấc mộng mới.' });
    }
})
router.get('/hi',async(req,res)=>{
    res.render("hi")
})
module.exports = router;
