const express = require('express');
const router = express.Router();
const Baiviet = require('../models/BaiVietModels');
const User = require('../models/UserModels');
const momenttimezone = require('moment-timezone');
const multer = require('multer');
const NotificationBaiviet = require('../models/NotifyBaiVietModel')
const UserGiaPha = require('../models/UserGiaPhaModels')

const DongHo = require("../models/DongHoModel");
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
    const dongho=await DongHo.findById(user.lineage._id);
    if(!dongho){
      return res.status(404).json({ message: 'không tìm thấy dòng họ' });
    }

    const vietnamTime = momenttimezone().add(7, 'hours').toDate();

    const baiviet = new Baiviet({ userId, content, like: 0, numberComment: 0, images: [], date: vietnamTime });

    if (req.files) {
      const images = req.files.map((file) => file.buffer.toString('base64'));
      if (images.length > 2) {
        return res.status(400).json({ message: 'Chỉ được phép tải lên tối đa 2 ảnh.' });
      }

      baiviet.images = images;
    }
    dongho.baiviet.push(baiviet._id);
    await baiviet.save();
    await dongho.save();
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

router.delete('/deletebaiviet/:userId/:postId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const postId = req.params.postId;

    const baiviet = await Baiviet.findById(postId);

    if (!baiviet) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    // Kiểm tra quyền xóa bài viết, chỉ cho phép người tạo bài xóa
    if (baiviet.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này' });
    }

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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    const dongho = await DongHo.findById(user.lineage._id);

    const posts = await Baiviet.find().populate('userId', 'username avatar');
    let donghodata = [];

    posts.forEach(baiviet => {
      const formatdate = moment(baiviet.date).format('DD/MM/YYYY HH:mm:ss');
      const isLiked = user.favoriteBaiviet.some(favorite => favorite.baivietId.toString() === baiviet._id.toString());
      const isBaivietInDongho = dongho.baiviet.some(dhBaiviet => dhBaiviet.toString() === baiviet._id.toString());

      if (isBaivietInDongho) {
        donghodata.push({
          _id: baiviet._id,
          userId: baiviet.userId._id,
          username: user.username,
          role: user.role,
          avatar: user.avatar || '',
          content: baiviet.content,
          like: baiviet.like,
          isLiked: isLiked,
          date: formatdate,
          images: baiviet.images
        });
      }
    });

    return res.status(200).json({ success: true, donghodata });
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
router.post('/postcmtbaiviet/:baivietId/:userId', async (req, res) => {
  try {
    const baivietId = req.params.baivietId;
    const userId = req.params.userId;
    const { comment } = req.body;
    const vietnamTime = momenttimezone().add(7, 'hours').toDate();
    const user = await User.findById(userId);

    if (!user) {
      res.status(403).json({ message: 'Không tìm thấy người dùng' });
    }

    const baiviet = await Baiviet.findById(baivietId);

    if (!baiviet) {
      res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    const newComment = {
      userID: userId,
      cmt: comment,
      date: vietnamTime
    };

    baiviet.comment.push(newComment);
    baiviet.numberComment += 1;
    await baiviet.save();

    if (baiviet.userId.toString() !== userId) {
      const notificationContentForPostOwner = `${user.username} đã bình luận bài viết:${baiviet.content} của bạn`;
      const notificationForPostOwner = new NotificationBaiviet({
        title: 'Bài viết có bình luận mới',
        content: notificationContentForPostOwner,
        userId: baiviet.userId,
        baivietId: baivietId,
        date: vietnamTime,
        isRead: true
      });
      await notificationForPostOwner.save();
    }

    res.status(200).json({ message: 'Đã thêm bình luận thành công' });
  } catch (error) {
    console.error('Lỗi khi post bình luận:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi post bình luận.' });
  }
});
router.get('/getcmtbaiviet/:baivietId', async (req, res) => {
  try {
    const baivietId = req.params.baivietId;
    const baiviet = await Baiviet.findById(baivietId).lean();

    if (!baiviet) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    // Tạo một đối tượng để lưu trữ thông tin role và avatar của mỗi người dùng
    const userRoles = {};

    // Lấy thông tin về người dùng từ danh sách comment
    const userIdsInComments = [...new Set(baiviet.comment.map(item => item.userID.toString()))];
    await Promise.all(
      userIdsInComments.map(async (userId) => {
        if (!userRoles[userId]) {
          const userInfo = await User.findById(userId).select('username role avatar');
          userRoles[userId] = {
            userId,
            username: userInfo.username,
            role: userInfo.role,
            avatar: userInfo.avatar || '',
          };
        }
      })
    );

    // Tạo danh sách comment với thông tin về người dùng
    const comments = await Promise.all(
      baiviet.comment.map(async (item) => {
        const usercmt = userRoles[item.userID.toString()];
        const formatdatecmt = moment(item.date).format('DD/MM/YYYY HH:mm:ss');

        return {
          _id: item._id,
          userId: item.userID,
          cmt: item.cmt,
          username: usercmt ? usercmt.username : '',
          avatar: usercmt ? usercmt.avatar : '',
          role: usercmt ? usercmt.role : '',
          date: formatdatecmt,
        };
      })
    );

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy bình luận bài viết' });
  }
});
router.put('/updatecmtbaiviet/:baivietId/:commentId', async (req, res) => {
  try {
    const baivietId = req.params.baivietId;
    const commentId = req.params.commentId;
    const { cmt } = req.body;

    const baiviet = await Baiviet.findById(baivietId);

    if (!baiviet) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    const comment = baiviet.comment.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Bình luận không tồn tại' });
    }

    comment.cmt = cmt;
    await baiviet.save();

    res.json({ message: 'Sửa bình luận thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi sửa bình luận' });
  }
});
router.delete('/deletecmtbaiviet/:baivietId/:commentId/:userId', async (req, res) => {
  try {
    const baivietId = req.params.baivietId;
    const commentId = req.params.commentId;
    const userId = req.params.userId;

    const baiviet = await Baiviet.findById(baivietId);

    if (!baiviet) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    // Tìm index của comment trong mảng
    const commentIndex = baiviet.comment.findIndex((item) => item._id.toString() === commentId);

    // Kiểm tra nếu không tìm thấy comment
    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Bình luận không tồn tại' });
    }

    // Kiểm tra xem người gửi yêu cầu có phải là người tạo comment không
    if (baiviet.comment[commentIndex].userID.toString() !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bình luận này' });
    }

    // Lấy số lượng bình luận trước khi xóa
    const commentCountBefore = baiviet.comment.length;

    // Sử dụng splice để xóa comment theo index
    baiviet.comment.splice(commentIndex, 1);

    // Lấy số lượng bình luận sau khi xóa
    const commentCountAfter = baiviet.comment.length;

    // Nếu có sự giảm số lượng bình luận, giảm giá trị numberComment và cập nhật lại bài viết
    if (commentCountAfter < commentCountBefore) {
      baiviet.numberComment -= 1;
      await baiviet.save();
      res.json({ message: 'Xóa bình luận thành công', commentCount: commentCountAfter });
    } else {
      res.json({ message: 'Xóa bình luận không thành công', commentCount: commentCountBefore });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa bình luận' });
  }
});


module.exports = router;
