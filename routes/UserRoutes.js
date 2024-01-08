const router = require("express").Router();
const User=require('../models/UserModels');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const multer = require('multer')

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.post('/register', async (req, res) => {
    try {
      const { username, password, phone, hovaten, date, phuongdiachi,quandiachi,thanhphodiachi,phuongque,quanque,thanhphoque,job} = req.body;
  
      
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
        address: {
            wards: phuongdiachi,
            districts: quandiachi,
            city: thanhphodiachi,
          },
          hometown: {
            wards: phuongque,
            districts: quanque,
            city: thanhphoque,
          }, 
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
              hovaten:user.hovaten,
              namsinh:user.date,
              tuoi:user.yearsold,
              phone: user.phone,
              address:user.address,
              hometown:user.hometown,
              job:user.job
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
                hovaten:user.hovaten,
                namsinh:user.date,
                tuoi:user.yearsold,
                phone: user.phone,
                address:user.address,
                hometown:user.hometown,
                job:user.job
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
  module.exports=router