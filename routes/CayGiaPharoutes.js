const router = require('express').Router()
const bcrypt = require('bcryptjs')
const multer = require('multer')
const DongHo = require('../models/DongHoModel')
const UserGiaPha = require('../models/UserGiaPhaModels')
const User = require('../models/UserModels')
const moment = require('moment');
const FCM = require('fcm-node');

const storage = multer.memoryStorage()

const upload = multer({ storage: storage })

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
            body: `Đến ngày giỗ của ${usergiapha.name}. Mong bạn bớt một chút thời gian để tưởng nhớ`,
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
const buildFamilyTree = async (donghoId, memberId, generation = 1) => {
  try {
    let member;

    const dongho = await DongHo.findById(donghoId);
    const firstUserId = dongho.user.length > 0 ? dongho.user[0]._id : null;
    if (!memberId) {
      member = await UserGiaPha.findById(firstUserId);
      console.log(member);
    } else {
      member = await UserGiaPha.findById(memberId);
      console.log(member);
    }

    if (!member) {
      return [];
    }

    const familyTreeNode = {
      _id: member._id,
      name: member.name,
      date: member.date,
      dead: member.dead,
      generation: generation,
      con: []
    }

    if (member.con && member.con.length > 0) {
      for (const child of member.con) {
        if (child && child._id) {
          const userchild = await UserGiaPha.findById(child._id);
          const childNode = await buildFamilyTree(userchild.lineage, child._id, generation + 1);
          console.log(childNode);
          if (childNode) {
            familyTreeNode.con.push(childNode);
          }
        }
      }
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

    const dongho = await DongHo.findById(donghoId);
    const firstUserId = dongho.userId.length > 0 ? dongho.userId[0]._id : null;
    const user = await User.findById(firstUserId);
    const { key } = req.body;
    if (!key) {
      return res.status(404).json({ message: 'bạn chưa nhập key' })
    }

    if (key != dongho.key) {
      return res.status(404).json({ message: 'bạn nhập sai key' })
    }

    let memberId = null

    const familyTreeJSON = await buildFamilyTree(donghoId, memberId);
    const familydata = {
      creator: {
        name: user.hovaten,
        phone: user.phone
      },
      familyTreeJSON
    }
    res.json(familydata);
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

//hàm tính số đời của cây gia phả
const countGenerations = (familyTree) => {
  let maxGeneration = 1;

  const traverseTree = (node, currentGeneration) => {
    maxGeneration = Math.max(maxGeneration, currentGeneration);

    for (const child of node.con) {
      traverseTree(child, currentGeneration + 1);
    }
  };

  traverseTree(familyTree, 1);

  return maxGeneration;
};

router.get('/getdongho', async (req, res) => {
  try {
    const dongho = await DongHo.find().lean();
    const donghodata = dongho.map(async (data) => {
      if (data && data._id) {
        const familyTree = await buildFamilyTree(data._id);
        const firstUserId = data.userId.length > 0 ? data.userId[0]._id : null;
        const user = await User.findById(firstUserId);
        if (familyTree && familyTree.con) {
          const totalGenerations = countGenerations(familyTree);
          return {
            _id: data._id,
            name: data.name,
            key: data.key,
            address: data.address,
            members: data.user ? data.user.length : 0,
            generation: totalGenerations,
            creator: {
              name: user ? user.hovaten : '', // Kiểm tra xem user có tồn tại không trước khi truy cập thuộc tính
              phone: user ? user.phone : '' // Kiểm tra xem user có tồn tại không trước khi truy cập thuộc tính
            }
          };
        } else {
          console.error(`Error building family tree for DongHo ${data._id}: Family tree or its children is null.`);
          return {
            _id: data._id,
            name: data.name,
            key: data.key,
            address: data.address,
            members: data.user ? data.user.length : 0,
            generation: 0, // Đặt generation là 0 khi familyTree hoặc familyTree.con là null hoặc rỗng
            creator: {
              name: user ? user.hovaten : '', // Kiểm tra xem user có tồn tại không trước khi truy cập thuộc tính
              phone: user ? user.phone : '' // Kiểm tra xem user có tồn tại không trước khi truy cập thuộc tính
            }
          };
        }
      } else {
        console.error(`Error building family tree: DongHo data is null or missing _id.`);
        return null;
      }
    });

    const resolvedDonghoData = await Promise.all(donghodata);
    res.json(resolvedDonghoData.filter(Boolean)); // Lọc bỏ các giá trị null khỏi mảng
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


router.post('/addcon/:idcha', async (req, res) => {
  try {
    const idcha = req.params.idcha
    const {
      name,
      userId,
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
      burialaddress
    } = req.body

    const cha = await UserGiaPha.findById(idcha)
    if (!cha) {
      return res.status(404).json({ error: 'Parent not found' })
    }

    const deaddateMoment = moment(deaddate, 'DD/MM/YYYY');
    const dateMoment = moment(date, 'DD/MM/YYYY');
    const lived = deaddateMoment.diff(dateMoment, 'years');

    const dongho = await DongHo.findById(cha.lineage)

    const newMemberData = {
      name,
      userId,
      nickname,
      sex,
      date,
      maritalstatus,
      academiclevel,
      job,
      address,
      hometown,
      bio,
      dead,
    };

    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
      }
      newMemberData.phone = phone;
    }

    if (userId) {
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({ error: 'Người dùng không tồn tại' })
      }
      newMemberData.userId = userId;
      dongho.userId.push(userId)
    }

    const newMember = new UserGiaPha(newMemberData);

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


router.post('/addMember/:iddongho', async (req, res) => {
  try {
    const iddongho = req.params.iddongho
    const {
      name,
      userId,
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
      burialaddress
    } = req.body

    const parent = await DongHo.findById(iddongho)
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' })
    }


    const deaddateMoment = moment(deaddate, 'DD/MM/YYYY');
    const dateMoment = moment(date, 'DD/MM/YYYY');
    const lived = deaddateMoment.diff(dateMoment, 'years');

    const newMemberData = {
      name,
      nickname,
      sex,
      date,
      maritalstatus,
      academiclevel,
      job,
      address,
      hometown,
      bio,
      dead,
    };

    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
      }
      newMemberData.phone = phone;
    }

    if (userId) {
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({ error: 'Người dùng không tồn tại' })
      }
      newMemberData.userId = userId;
      parent.userId.push(userId)
    }

    const newMember = new UserGiaPha(newMemberData);

    if (newMember.dead == false) {
      newMember.deadinfo = undefined;
    } else {
      newMember.deadinfo = { deaddate, lived, worshipaddress, worshipperson, burialaddress };
    }

    newMember.lineage = parent._id

    parent.user.push(newMember._id)

    await newMember.save()
    await parent.save()

    res.json(newMember)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.post('/postdongho/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    const { name, address, key } = req.body
    const dongho = new DongHo({
      name,
      address,
      key
    })
    user.lineage = dongho._id
    user.role = 'admin';
    dongho.userId.push(userId)
    await dongho.save()
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
    }
    res.json(resdata);
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


module.exports = router
