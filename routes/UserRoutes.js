const router = require("express").Router();
const User = require('../models/UserModels');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.post('/register', async (req, res) => {
  try {
    const { username, password, phone, hovaten, date, address, hometown, job, role } = req.body;


    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }
    const exitphone = await User.findOne({ phone });
    if (exitphone) {
      return res.status(400).json({ message: 'số điện thoại đã được đăng kí' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Tên người dùng đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const currentDate = new Date();
    const birthDate = new Date(date);
    const yearsold = currentDate.getFullYear() - birthDate.getFullYear();

    const user = new User({
      username,
      password: hashedPassword,
      phone,
      role,
      address,
      hometown,
      date,
      hovaten,
      job,
      yearsold
    });
    await user.save();

    const responseData = {
      success: user.success,
      data: {
        user: [
          {
            _id: user._id,
            username: user.username,
            password: user.password,
            hovaten: user.hovaten,
            namsinh: user.date,
            tuoi: user.yearsold,
            phone: user.phone,
            address: user.address,
            hometown: user.hometown,
            job: user.job,
            role: user.role
          },
        ],
      },
    };

    res.status(201).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Đã xảy ra lỗi.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    const responseData = {
      success: user.success,
      data: {
        user: [
          {
            _id: user._id,
            username: user.username,
            password: user.password,
            hovaten: user.hovaten,
            namsinh: user.date,
            tuoi: user.yearsold,
            phone: user.phone,
            address: user.address,
            hometown: user.hometown,
            job: user.job,
            role: user.role
          },
        ],
      },
    };

    const token = jwt.sign({ userId: user._id, role: user.role }, 'mysecretkey');
    responseData.token = token;
    res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Đã xảy ra lỗi.' });
  }
});
router.put('/updateUser/:idUser', async (req, res) => {
  try {
    const { hovaten, namsinh, tuoi, phone, address, hometown, job } = req.body;
    const userId = req.params.idUser;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    // Cập nhật chỉ những trường mà người dùng đã thay đổi
    if (hovaten) user.hovaten = hovaten;
    if (namsinh) user.date = namsinh;
    if (tuoi) user.yearsold = tuoi;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (hometown) user.hometown = hometown;
    if (job) user.job = job;

    await user.save();

    // Tạo token mới sau khi cập nhật thông tin
    const token = jwt.sign({ userId: user._id, role: user.role }, 'mysecretkey');

    // Chuẩn bị dữ liệu phản hồi
    const responseData = {
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          hovaten: user.hovaten,
          namsinh: user.date,
          tuoi: user.yearsold,
          phone: user.phone,
          address: user.address,
          hometown: user.hometown,
          job: user.job,
          role: user.role
        },
      },
    };

    responseData.token = token;
    res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Đã xảy ra lỗi.' });
  }
});

router.delete('/deleteUser/:idUser', async (req, res) => {
  try {
    const userId = req.params.idUser;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }
    await User.deleteOne({ _id: userId });


    const responseData = {
      success: true,
      message: 'Người dùng đã được xóa thành công.'
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Đã xảy ra lỗi.' });
  }
});

module.exports = router