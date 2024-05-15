const express = require('express');
const router = express.Router();
const Model = require('../models/model');

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
router.post('/modelpost', async (req, res) => {
    try {
        const { name } = req.body;
        const newmodel = new Model({ name});
        await newmodel.save();

        res.json({message:'thêm thành công'})
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm giấc mộng mới.' });
    }
});
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
module.exports = router;
