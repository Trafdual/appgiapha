const router = require('express').Router()
const bcrypt = require('bcryptjs')
const multer = require('multer')
const DongHo = require('../models/DongHoModel')
const UserGiaPha = require('../models/UserGiaPhaModels')
const User = require('../models/UserModels')
const moment = require('moment');
const FCM = require('fcm-node');


// Khởi tạo Firebase Admin SDK
// Đảm bảo bạn đã cung cấp đúng thông tin đăng nhập vào tệp sao lưu

const storage = multer.memoryStorage()

const upload = multer({ storage: storage })

//xem lại cây gia phả có thể chuyển thành truyền userId để check xem có lineage chưa nếu có rồi thì cho get ra cây gia phả luôn 
// chưa có thì bắt nhập key để join vào cây gia phả 

const fcm = new FCM('AAAAweb7fLc:APA91bE6i6LcEfNK3rCzjJzpfAjn9vH2ACm-cJ_Kct88B2xXuxOBexUpiQMEZetAAypqYNcLv9Q7fU3oEfpFSHOwr_HAHqVoZnOuyJKss1b4AszppzT52XhaqT5frYfx582Bnwku67jk');

// Hàm kiểm tra ngày giỗ và gửi thông báo
async function checkAndSendNotifications(userIdgiapha,userId) {
    try {
        const usergiapha=await UserGiaPha.findOne({userId:userIdgiapha});
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
      return null;
    }

    const familyTreeNode = {
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
      generation:generation,
      con: []
    }

    if (familyTreeNode.dead == false) {
      member.deadinfo = undefined;
      familyTreeNode.deadinfo = member.deadinfo
    } else {
      familyTreeNode.deadinfo = member.deadinfo
    }

    for (const child of member.con) {
      if (child._id) {
        const userchild = await UserGiaPha.findById(child._id);
        const childNode = await buildFamilyTree(userchild.lineage, child._id,generation + 1)
        console.log(childNode)
        if (childNode) {
          familyTreeNode.con.push(childNode)
        }
      }
    }

    return familyTreeNode
  } catch (error) {
    console.error(
      `Error building family tree for member ${memberId}: ${error.message}`
    )
  }
}

router.get('/familyTree/:donghoId', async (req, res) => {
  try {
    const donghoId=req.params.donghoId;

    const dongho=await DongHo.findById(donghoId);
    const { key } = req.body;
    if (!key) {
      return res.status(404).json({ message: 'bạn chưa nhập key' })
    }

    if(key!=dongho.key){
      return res.status(404).json({ message: 'bạn nhập sai key' })
    }

    let memberId=null
    const familyTreeJSON = await buildFamilyTree(donghoId,memberId);
    res.json(familyTreeJSON)
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
      if ( !/^\d{10}$/.test(phone)) {
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
      if ( !/^\d{10}$/.test(phone)) {
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
    const user=await User.findById(userId);
    const { name, address,key } = req.body
    const dongho = new DongHo({
      name,
      address,
      key
    })
    user.lineage=dongho._id
    user.role='admin';
    await dongho.save()
    await user.save();
    const resdata={
      iddongho:dongho._id,
      namedongho:dongho.name,
      addressdongho:dongho.address,
      key:dongho.key,
      username:user.username,
      hovaten:user.hovaten,
      address:user.address,
      hometown:user.hometown,
      phone:user.phone,
      role:user.role
    }
    res.json(resdata);
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.get('/getdongho', async (req, res) => {
  try {
    const dongho = await DongHo.find().lean()
    res.json(dongho)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
module.exports = router
