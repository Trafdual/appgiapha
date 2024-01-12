const express = require('express');
const router = express.Router();
const Baiviet = require('../models/BaiVietModels');
const User = require('../models/UserModels');
const momenttimezone = require('moment-timezone');
const multer = require('multer');
const NotificationBaiviet = require('../models/NotifyBaiVietModel')
const moment = require('moment');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API đăng bài viết
router.post('/postbaiviet/:userId', upload.array('images', 10), async (req, res) => {
  try {
    const userId = req.params.userId;
    const { content } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    const vietnamTime = momenttimezone().add(7, 'hours').toDate();

    const baiviet = new Baiviet({ userId, content, like: 0, images: [], date: vietnamTime });

    if (req.files) {
      const images = req.files.map((file) => file.buffer.toString('base64'));
      if (images.length > 2) {
        return res.status(400).json({ message: 'Chỉ được phép tải lên tối đa 2 ảnh.' });
      }

      baiviet.images = images;
    }

    await baiviet.save();
    if (!user.baiviet) {
      user.baiviet = [];
    }

    user.baiviet.push(baiviet._id);
    await user.save();

    return res.status(200).json({ message: 'Đăng bài viết thành công' });
  } catch (err) {
    console.error('Lỗi khi đăng bài viết:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi đăng bài viết.' });
  }
});

router.delete('/deletebaiviet/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;

    const baiviet = await Baiviet.findById(postId);

    if (!baiviet) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    // Kiểm tra quyền xóa bài viết, ví dụ chỉ cho phép người tạo bài xóa
    // if (baiviet.userId.toString() !== req.session.userId) {
    //   return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này' });
    // }

    await Baiviet.deleteOne({ _id: postId });

    return res.status(200).json({ message: 'Xóa bài viết thành công' });
  } catch (err) {
    console.error('Lỗi khi xóa bài viết:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa bài viết.' });
  }
});

// API sửa bài viết
router.put('/updatebaiviet/:postId', upload.array('images', 10), async (req, res) => {
  try {
    const postId = req.params.postId;
    const { content } = req.body;

    const baiviet = await Baiviet.findById(postId);

    if (!baiviet) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    // Kiểm tra quyền sửa bài viết, ví dụ chỉ cho phép người tạo bài sửa
    // if (baiviet.userId.toString() !== req.session.userId) {
    //   return res.status(403).json({ message: 'Bạn không có quyền sửa bài viết này' });
    // }

    if (content !== undefined && content !== null) {
      baiviet.content = content;
    }

    if (req.files) {
      const images = req.files.map((file) => file.buffer.toString('base64'));

      if (images.length > 2) {
        return res.status(400).json({ message: 'Chỉ được phép tải lên tối đa 2 ảnh.' });
      }

      if (images.length > 0) {
        baiviet.images = images;
      }
    }

    await baiviet.save();

    return res.status(200).json({ message: 'Sửa bài viết thành công' });
  } catch (err) {
    console.error('Lỗi khi sửa bài viết:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi sửa bài viết.' });
  }
});


router.get('/getbaiviet/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Lấy thông tin người dùng từ cơ sở dữ liệu
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    let query = {};

    // Nếu có userId được cung cấp, chỉ lấy bài viết của người dùng đó
    if (userId) {
      query.userId = userId;
    }
    const posts = await Baiviet.find(query).populate('userId', 'username avatar');

    // Kiểm tra và cập nhật trạng thái isLiked
    posts.forEach(post => {
      post.isLiked = user.favoriteBaiviet.some(item => item.baivietId.toString() === post._id.toString() && item.isLiked === true);
    });

    return res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// LIKE bài viết 
router.post('/addfavoritebaiviet/:userId/:baivietId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const baivietId = req.params.baivietId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(403).json({ message: 'Không tìm thấy người dùng' });
    }

    const baivietIndex = user.favoriteBaiviet.findIndex(baiviet => baiviet.baivietId === baivietId);

    if (baivietIndex === -1) {
      user.favoriteBaiviet.push({ baivietId, isLiked: true });
    } else {
      user.favoriteBaiviet[baivietIndex].isLiked = true;
    }

    const vietnamTime = momenttimezone().add(7, 'hours').toDate();
    const baiviet = await Baiviet.findById(baivietId);

    if (baiviet) {
      baiviet.like += 1;
      await baiviet.save();

      if (baiviet.userId.toString() !== userId) {
        const notificationContentForPostOwner = `${user.username} đã thích bài viết của bạn: ${baiviet.content}`;
        const notificationForPostOwner = new NotificationBaiviet({
          title: 'Bài viết được thích',
          content: notificationContentForPostOwner,
          userId: baiviet.userId,
          baivietId: baivietId,
          date: vietnamTime,
          isRead: true
        });

        await notificationForPostOwner.save();
      }
    }

    await user.save();

    return res.json({ message: 'Bài viết đã được yêu thích.' });
  } catch (err) {
    console.error('Lỗi khi thích bài viết:', err);
    return res.status(500).json({ error: 'Đã xảy ra lỗi khi thích bài viết.' });
  }
});
// thông báo
router.get('/notifybaiviet/:userId', async (req, res) => {
  try {
    const userID = req.params.userId;
    const notify = await NotificationBaiviet.find({ userId: userID }).sort({ date: -1 }).lean();
    const formatnotify = notify.map((item) => {
      const formattedDate = moment(item.date).format('DD/MM/YYYY HH:mm:ss');
      return {
        _id: item._id,
        title: item.title,
        content: item.content,
        userId: item.userId,
        date: formattedDate,
        baivietId: item.baivietId
      };
    });
    res.json(formatnotify);
  } catch (error) {
    console.error('Lỗi khi tìm thông báo:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi tìm thông báo.' });
  }
});

module.exports = router;
