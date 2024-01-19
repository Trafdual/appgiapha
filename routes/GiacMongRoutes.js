const express = require('express');
const router = express.Router();
const Dream = require('../models/GiacmongModel');

// Lấy danh sách tất cả giấc mộng
router.get('/dreams', async (req, res) => {
    try {
        const dreams = await Dream.find();
        res.json(dreams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách giấc mộng.' });
    }
});

// Lấy chi tiết của một giấc mộng dựa trên ID
router.get('/dreams/:id', async (req, res) => {
    try {
        const dream = await Dream.findById(req.params.id);
        if (!dream) {
            return res.status(404).json({ message: 'Không tìm thấy giấc mộng.' });
        }
        res.json({ dream });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy thông tin giấc mộng.' });
    }
});

// Thêm giấc mộng mới
router.post('/dreams', async (req, res) => {
    try {
        const { name, description } = req.body;
        const newDream = new Dream({ name, description });
        await newDream.save();

        res.json(newDream);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm giấc mộng mới.' });
    }
});

// Sửa thông tin giấc mộng
router.put('/dreams/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        const updatedDream = await Dream.findByIdAndUpdate(req.params.id, { name, description }, { new: true });

        if (!updatedDream) {
            return res.status(404).json({ message: 'Không tìm thấy giấc mộng để sửa.' });
        }

        res.json(updatedDream);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi sửa thông tin giấc mộng.' });
    }
});

// Xóa giấc mộng
router.delete('/dreams/:id', async (req, res) => {
    try {
        // Xóa giấc mộng
        const deletedDream = await Dream.findByIdAndDelete(req.params.id);

        if (!deletedDream) {
            return res.status(404).json({ message: 'Không tìm thấy giấc mộng để xóa.' });
        }
        res.json({ message: 'Xóa giấc mộng thành công.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa giấc mộng.' });
    }
});

module.exports = router;
