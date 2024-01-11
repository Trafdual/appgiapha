const router = require('express').Router()
const bcrypt = require('bcryptjs')
const multer = require('multer')
const DongHo = require('../models/DongHoModel')
const UserGiaPha = require('../models/UserGiaPhaModels')
const User = require('../models/UserModels')
const moment = require('moment');

const storage = multer.memoryStorage()

const upload = multer({ storage: storage })

const buildFamilyTree = async (donghoId, memberId) => {
  try {
    let member;

    const dongho = await DongHo.findById(donghoId);
    const firstUserId = dongho.user.length > 0 ? dongho.user[0]._id : null;
    // Đổi điều kiện từ if (memberId) sang if (!memberId)
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
        const childNode = await buildFamilyTree(userchild.lineage, child._id)
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

router.get('/familyTree', async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(404).json({ message: 'bạn chưa nhập key' })
    }
   let memberId=null
    const familyTreeJSON = await buildFamilyTree(key,memberId);
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

    if (userId) {
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({ error: 'Người dùng không tồn tại' })
      }
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

    const newMember = new UserGiaPha(newMemberData);

    if (newMember.dead == false) {
      newMember.deadinfo = undefined;
    } else {
      newMember.deadinfo = { deaddate, lived, worshipaddress, worshipperson, burialaddress };
    }

    newMember.lineage = dongho._id // Gán dòng họ cho thành viên mới

    cha.con.push(newMember._id)

    dongho.user.push(newMember._id)
    dongho.userId.push(userId)

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
    if (userId) {
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({ error: 'Người dùng không tồn tại' })
      }
    }

    const deaddateMoment = moment(deaddate, 'DD/MM/YYYY');
    const dateMoment = moment(date, 'DD/MM/YYYY');
    const lived = deaddateMoment.diff(dateMoment, 'years');

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

    const newMember = new UserGiaPha(newMemberData);

    if (newMember.dead == false) {
      newMember.deadinfo = undefined;
    } else {
      newMember.deadinfo = { deaddate, lived, worshipaddress, worshipperson, burialaddress };
    }

    newMember.lineage = parent._id

    parent.user.push(newMember._id)
    parent.userId.push(userId)

    await newMember.save()
    await parent.save()

    res.json(newMember)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.post('/postdongho', async (req, res) => {
  try {
    const { name, address } = req.body
    const dongho = new DongHo({
      name,
      address
    })
    dongho.key = dongho._id;
    await dongho.save()
    res.json(dongho)
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
