const router = require("express").Router();
const Event = require("../models/EventModel");

// Thêm sự kiện
router.post('/postevent', async (req, res) => {
    try {
        const { name, date } = req.body;
        const event = new Event({ name, date });
        await event.save();
        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
});

// Lấy ra danh sách sự kiện
router.get('/getevents', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
});

// Sửa sự kiện
router.put('/editevent/:id', async (req, res) => {
    try {
        const { name, date } = req.body;
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, { name, date }, { new: true });
        res.json(updatedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
});

// Xóa sự kiện
router.delete('/deleteevent/:id', async (req, res) => {
    try {
        const deletedEvent = await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Xóa ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
});

module.exports = router;
