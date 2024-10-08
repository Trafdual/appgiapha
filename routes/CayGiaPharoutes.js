const router = require('express').Router()
const bcrypt = require('bcryptjs')
const multer = require('multer')
const DongHo = require('../models/DongHoModel')
const UserGiaPha = require('../models/UserGiaPhaModels')
const User = require('../models/UserModels')
const moment = require('moment');
const fs = require('fs');
const AWS = require('aws-sdk');

const upload = multer({
  storage: multer.memoryStorage(), // Sử dụng lưu trữ trong bộ nhớ
});

const FCM = require('fcm-node');

AWS.config.update({
  accessKeyId: 'AKIATBPL3NPE3ATWZEWR',
  secretAccessKey: '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'
});
const s3 = new AWS.S3();
s3.listBuckets((err,data)=>{
if(err) console.log(err,err.stack)
else console.log(data)
})

const uploadAvatarToS3 = async (avatarPath,avatarName) => {

  // Cấu hình tham số cho việc tải lên
  const params = {
    Bucket: 'giapha',
    Key: avatarName,
    Body: avatarPath
  };

  try {
    // Thực hiện tải ảnh lên S3
    const uploadedData = await s3.upload(params).promise();
    return uploadedData.Location; // Trả về đường dẫn của ảnh trên S3
  } catch (error) {
    console.error('Error uploading avatar to S3:', error);
    throw error;
  }
};


const fcm = new FCM('AAAAweb7fLc:APA91bE6i6LcEfNK3rCzjJzpfAjn9vH2ACm-cJ_Kct88B2xXuxOBexUpiQMEZetAAypqYNcLv9Q7fU3oEfpFSHOwr_HAHqVoZnOuyJKss1b4AszppzT52XhaqT5frYfx582Bnwku67jk');

// Hàm kiểm tra ngày giỗ và gửi thông báo (đang thử nghiệm, có thể cần truyền thêm token)
async function checkAndSendNotifications(userIdgiapha, userId) {
  try {
    const usergiapha = await UserGiaPha.findOne({ userId: userIdgiapha });
    const user = await User.findById(userId);


    if (user && user.fcmToken) {

      const currentDate = new Date();
      const currendateMoment = moment(currentDate, 'DD/MM/YYYY');
      const deaddateMoment = moment(usergiapha.deadinfo.deaddate, 'DD/MM/YYYY');

      // Kiểm tra xem đã đến ngày giỗ chưa
      if (currendateMoment === deaddateMoment) {
        // Gửi thông báo đến thiết bị
        const message = {
          to: user.fcmToken,
          notification: {
            title: 'Thông báo',
            body: `Đến ngày giỗ của ${usergiapha.name}. Mong bạn bớt một chút thời gian để tưởng nhớ người đã khuất`,
          },
        };

        fcm.send(message, function (err, response) {
          if (err) {
            console.log('Lỗi khi gửi thông báo:', err);
          } else {
            console.log('Thông báo đã được gửi:', response);
          }
        });
      }
    }
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
  }
}
//cây gia phả

const buildFamilyTree = async (donghoId, memberId) => {
  try {
    const dongho = await DongHo.findById(donghoId).populate('user');
    const firstUserId = dongho.user.length > 0 ? dongho.user[0]._id : null;

    const member = !memberId ? await UserGiaPha.findById(firstUserId) : await UserGiaPha.findById(memberId);

    if (!member) {
      return [];
    }

    const familyTreeNode = {
      _id: member._id,
      name: member.name,
      date: member.date,
      avatar: member.avatar || '',
      dead: member.dead,
      relationship: member.relationship,
      con: []
    }

    if (member.con && member.con.length > 0) {
           const childPromises = member.con.map(async (child) => {
        if (child && child._id) {
          const userchild = await UserGiaPha.findById(child._id);
          const childNode = await buildFamilyTree(userchild.lineage, child._id);
          if (childNode.length > 0) {
            familyTreeNode.con.push(childNode);
          }
        }
      });
      await Promise.all(childPromises);
    }

    return [familyTreeNode];
  } catch (error) {
    console.error(
      `Error building family tree for member ${memberId}: ${error.message}`
    )
  }
}

router.get('/familyTree/:donghoId', async (req, res) => {
  try {
    const donghoId = req.params.donghoId;

    const dongho = await DongHo.findById(donghoId).populate('userId');
    const firstUserId = dongho.userId.length > 0 ? dongho.userId[0]._id : null;
    const user = await User.findById(firstUserId);
    const familyTreeJSON = await buildFamilyTree(donghoId, null);
    const familydata = {
      creator: {
        name: user.hovaten,
        phone: user.phone,
        namegiapha: dongho.name
      },
      familyTreeJSON
    };

    res.json(familydata);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/getdongho', async (req, res) => {
  try {
    const dongho = await DongHo.find().populate('userId').lean();

    const donghodata = dongho.map(data => ({
      _id: data._id,
      name: data.name,
      key: data.key,
      address: data.address,
      members: data.userId ? data.userId.length : 0,
      creator: {
        name: data.userId?.[0]?.hovaten || '', // Sử dụng optional chaining operator
        phone: data.userId?.[0]?.phone || '' // Sử dụng optional chaining operator
      }
    }));

    const filteredDonghoData = donghodata.filter(data => data !== null); // Loại bỏ các giá trị null khỏi mảng

    res.json(filteredDonghoData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/joindongho/:donghoId/:userId', async (req, res) => {
  try {
    const donghoId = req.params.donghoId;
    const userId = req.params.userId;

    const user = await User.findById(userId);

    const dongho = await DongHo.findById(donghoId);
    const { key } = req.body;
    if (!key) {
      return res.status(404).json({ message: 'Bạn chưa nhập key' })
    }

    if (key !== dongho.key) {
      return res.status(404).json({ message: 'Bạn nhập sai key' })
    }

    user.lineage = dongho._id;
    dongho.userId.push(userId);
    await user.save();
    await dongho.save();

    // Retrieve updated user information
    const updatedUser = await User.findById(userId);

    res.json({
      success: updatedUser.success,
      data: {
        user: [
          {
            _id: updatedUser._id,
            username: updatedUser.username,
            password: updatedUser.password,
            hovaten: updatedUser.hovaten,
            avatar: updatedUser.avatar || '',
            namsinh: updatedUser.date,
            tuoi: updatedUser.yearsold,
            phone: updatedUser.phone,
            address: updatedUser.address,
            hometown: updatedUser.hometown,
            job: updatedUser.job,
            role: updatedUser.role,
            lineage: updatedUser.lineage || ''
          },
        ],
      },
    });

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


router.post('/addcon/:idcha',upload.single('avatar'), async (req, res) => {
  try {
    const idcha = req.params.idcha
    const {
      name,
      username,
      nickname,
      relationship,
      sex,
      date,
      maritalstatus,
      phone,
      academiclevel,
      job,
      address,
      hometown,
      bio,
      dead,
      deaddate,
      worshipaddress,
      worshipperson,
      burialaddress,
    } = req.body
    const avatar=req.file.originalname;
    const avatarpath=await uploadAvatarToS3(req.file.buffer,avatar); 
    const cha = await UserGiaPha.findById(idcha)
    if (!cha) {
      return res.status(404).json({ error: 'Parent not found' })
    }

    const deaddateMoment = moment(deaddate, 'DD/MM/YYYY');
    const dateMoment = moment(date, 'DD/MM/YYYY');
    const lived = deaddateMoment.diff(dateMoment, 'years');

    const dongho = await DongHo.findById(cha.lineage)


    const newMember = new UserGiaPha({
      name,
      nickname,
      sex,
      date,
      relationship,
      maritalstatus,
      academiclevel,
      job,
      address,
      hometown,
      bio,
      dead,
      avatar:avatarpath
    });

    const user = await User.findOne(username);

    if (user) {
      newMember.userId = user._id;
      dongho.userId.push(user._id)
    }

    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
      }
      newMember.phone = phone;
    }

    if (newMember.dead == false) {
      newMember.deadinfo = undefined;
    } else {
      newMember.deadinfo = { deaddate, lived, worshipaddress, worshipperson, burialaddress };
    }

    newMember.lineage = dongho._id // Gán dòng họ cho thành viên mới

    cha.con.push(newMember._id)

    dongho.user.push(newMember._id)


    await newMember.save()
    await dongho.save()
    await cha.save()

    res.json(newMember)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.post('/editcon/:idcon',async(req,res)=>{
  try {
    const idcon = req.params.idcon
    const {
      name,
      nickname,
      relationship,
      sex,
      date,
      maritalstatus,
      phone,
      academiclevel,
      job,
      address,
      hometown,
      bio,
      dead,
      deaddate,
      worshipaddress,
      worshipperson,
      burialaddress,
    } = req.body
    const avatar = 'http://localhost:8080/meo1.jpg';
    const con = await UserGiaPha.findById(idcon)
    con.name=name;
    con.nickname=nickname;
    con.relationship=relationship;
    con.sex=sex;
    con.maritalstatus=maritalstatus;
    con.academiclevel=academiclevel;
    con.job=job;
    con.address=address;
    con.hometown=hometown;
    con.bio=bio;
    con.dead=dead;
    con.avatar=avatar;
    if (!con) {
      return res.status(404).json({ error: 'Parent not found' })
    }

    const deaddateMoment = moment(deaddate, 'DD/MM/YYYY');
    const dateMoment = moment(date, 'DD/MM/YYYY');
    const lived = deaddateMoment.diff(dateMoment, 'years');


    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
      }
      con.phone = phone;
    }

    if (con.dead == false) {
      con.deadinfo = undefined;
    } else {
      con.deadinfo = { deaddate, lived, worshipaddress, worshipperson, burialaddress };
    }
    await con.save();
    res.json(con);
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.get('/gettenUser/:donghoId', async (req, res) => {
  try {
    const donghoId = req.params.donghoId;
    const dongho = await DongHo.findById(donghoId);

    if (!dongho) {
      return res.status(404).json({ message: 'Không tìm thấy đối tượng dòng họ' });
    }

    const userIds = dongho.userId; // Lấy ra mảng userId từ đối tượng dongho

    if (!userIds || userIds.length === 0) {
      return res.status(404).json({ message: 'Không có userId nào được tìm thấy trong đối tượng dòng họ' });
    }

    const users = await User.find({ _id: { $in: userIds } }); // Truy vấn tất cả người dùng với các userId trong mảng userIds

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }

    const userNames = users.map(user => user.username); // Thu thập tên của tất cả người dùng

    res.json(userNames); // Gửi danh sách tên người dùng trong phản hồi
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

router.get('/getmember', async (req, res) => {
  try {
    const user = await UserGiaPha.find()
    const userdata = user.map(u => {
      const co = u.con.map(c => {
        return {
          _id: c._id
        }
      })
      return {
        name: u.name,
        con: co
      }
    })
    res.json(userdata)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.get('/getmember/:userId', async (req, res) => {

  try {
    const userId = req.params.userId;

    const member = await UserGiaPha.findById(userId);
    const userdata = {
      _id: member._id,
      name: member.name,
      nickname: member.nickname,
      sex: member.sex,
      date: member.date,
      academiclevel: member.academiclevel,
      phone: member.phone,
      maritalstatus: member.maritalstatus,
      job: member.job,
      address: member.address,
      hometown: member.hometown,
      bio: member.bio,
      dead: member.dead,
      lineage: member.lineage,
      avatar: member.avatar
    }

    if (userdata.dead == false) {
      member.deadinfo = undefined;
      userdata.deadinfo = member.deadinfo
    } else {
      userdata.deadinfo = member.deadinfo
    }
    res.json(userdata)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


router.post('/addMember/:iddongho',upload.single('avatar') ,async (req, res) => {
  try {
    const iddongho = req.params.iddongho
    const {
      name,
      username,
      nickname,
      sex,
      date,
      maritalstatus,
      phone,
      academiclevel,
      job,
      address,
      hometown,
      bio,
      dead,
      deaddate,
      worshipaddress,
      worshipperson,
      burialaddress,
    } = req.body

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const avatar=req.file.originalname;
    const avatarpath=await uploadAvatarToS3(req.file.buffer,avatar); 
    // Tạo một object chứa dữ liệu mới của thành viên
    const parent = await DongHo.findById(iddongho)
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' })
    }

    const deaddateMoment = moment(deaddate, 'DD/MM/YYYY');
    const dateMoment = moment(date, 'DD/MM/YYYY');
    const lived = deaddateMoment.diff(dateMoment, 'years');

    const newMemberData = {
      name: name,
      nickname: nickname,
      sex: sex,
      date: date,
      maritalstatus: maritalstatus,
      academiclevel: academiclevel,
      job: job,
      address: address,
      hometown: hometown,
      bio: bio,
      dead: dead,
      avatar: avatarpath
    };

    // Kiểm tra và thêm phone nếu có
    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
      }
      newMemberData.phone = phone;
    }

    // Tìm user và thêm userId nếu tồn tại
    const user = await User.findOne(username);
    if (user) {
      newMemberData.userId = user._id;
      parent.userId.push(user._id)
    }

    // Tạo một đối tượng mới của UserGiaPha với dữ liệu được xây dựng
    const newMember = new UserGiaPha(newMemberData);

    // Xử lý thông tin khi thành viên đã mất
    if (newMember.dead) {
      newMember.deadinfo = {
        deaddate: deaddate,
        lived: lived,
        worshipaddress: worshipaddress,
        worshipperson: worshipperson,
        burialaddress: burialaddress
      };
    }

    // Thiết lập quan hệ giữa thành viên mới và đơn vị cấp trên
    newMember.lineage = parent._id
    parent.user.push(newMember._id)

    // Lưu thành viên mới và đơn vị cấp trên
    await newMember.save()
    await parent.save()

    res.json(newMember)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


//người dùng chỉ được tạo 1 dòng họ
router.post('/postdongho/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    // Kiểm tra nếu người dùng đã có dòng họ
    if (user.lineage) {
      return res.status(400).json({ error: 'Người dùng đã có dòng họ. Vui lòng xóa dòng họ hiện tại trước khi tạo dòng họ mới.' });
    }

    const { name, address, key } = req.body;
    const dongho = new DongHo({
      name,
      address,
      key
    });

    user.lineage = dongho._id; // Gán dòng họ cho người dùng
    user.role = 'admin'; // Đặt vai trò là admin
    dongho.userId.push(userId); // Liên kết dòng họ với người dùng

    await dongho.save();
    await user.save();

    const resdata = {
      iddongho: dongho._id,
      namedongho: dongho.name,
      addressdongho: dongho.address,
      key: dongho.key,
      username: user.username,
      hovaten: user.hovaten,
      address: user.address,
      hometown: user.hometown,
      phone: user.phone,
      role: user.role
    };

    res.json(resdata);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

// API xóa dòng họ
router.delete('/xoadongho/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    // Kiểm tra nếu người dùng không có dòng họ
    if (!user.lineage) {
      return res.status(400).json({ error: 'Người dùng chưa có dòng họ để xóa.' });
    }

    // Xóa dòng họ dựa trên _id
    const dongho = await DongHo.findById(user.lineage);
    
    if (dongho) {
      await DongHo.findByIdAndDelete(user.lineage);
      user.lineage = '';
      user.role = 'user'; // Đặt vai trò mặc định là 'user' sau khi xóa dòng họ
      await user.save();

      res.json({ message: 'Đã xóa dòng họ thành công.' });
    } else {
      res.status(404).json({ error: 'Không tìm thấy dòng họ.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});


module.exports = router
