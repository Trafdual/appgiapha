const router = require("express").Router();
const bcrypt = require("bcryptjs");
const multer = require('multer');
const DongHo = require("../models/DongHoModel");
const UserGiaPha=require('../models/UserGiaPhaModels');

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

const buildFamilyTree = async (memberId) => {
  try {
    let member;

  // Nếu không có memberId được cung cấp, lấy thành viên đầu tiên
  if (!memberId) {
    member = await UserGiaPha.findOne();
  } else {
    // Ngược lại, lấy thành viên theo ID được cung cấp
    member = await UserGiaPha.findById(memberId)
  }

  if (!member) {
    return null;
  }

  const familyTreeNode = {
    _id:member._id,
    name: member.name,
    gioitinh: member.sex,
    lineage:member.lineage,
    con: [],
  };

  for (const child of member.con) {
    if (child._id) {
      const childNode = await buildFamilyTree(child._id);
      console.log(childNode);
      if (childNode) {
        familyTreeNode.con.push(childNode);
      }
    }
  }

  return familyTreeNode;
  } catch (error) {
    console.error(`Error building family tree for member ${memberId}: ${error.message}`);
  }
  
};

router.get('/familyTree', async (req, res) => {
  try {
    const familyTreeJSON = await buildFamilyTree();
    res.json(familyTreeJSON);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/addcon/:idcha', async (req, res) => {
  try {
    const idcha=req.params.idcha;
    const { name } = req.body;

    const cha = await UserGiaPha.findById(idcha);
    if (!cha) {
      return res.status(404).json({ error: 'Parent not found' });
    }
    const dongho= await DongHo.findById(cha.lineage);

    const newMember = new UserGiaPha({name});
    newMember.lineage = dongho._id; // Gán dòng họ cho thành viên mới

    cha.con.push(newMember._id);

    dongho.user.push(newMember._id);
    
    await newMember.save();
    await dongho.save();
    await cha.save();

    res.json(newMember);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/getmember', async (req, res) => {
  try {
    const user=await UserGiaPha.find();
    const userdata=user.map(u=>{
      const co=u.con.map(c=>{
        return{
          _id:c._id
        }
      })
      return{
        name:u.name,
        con:co
      }
    }
    )
    res.json(userdata);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/addMember/:iddongho', async (req, res) => {
  try {
    const iddongho=req.params.iddongho;
    const { name } = req.body;

    const parent = await DongHo.findById(iddongho);
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const newMember = new UserGiaPha({name});
    newMember.lineage = parent._id; // Gán dòng họ cho thành viên mới

    parent.user.push(newMember._id);
    
    await newMember.save();
    await parent.save();

    res.json(newMember);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/postdongho',async(req,res)=>{
  try {
    const{name,key}=req.body
    const hashkey = await bcrypt.hash(key, 10);
    const dongho = new DongHo({
      name,
      key:hashkey
    });
    await dongho.save();
    res.json(dongho)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.get('/getdongho',async(req,res)=>{
  try {
    const dongho=await DongHo.find().lean();
    res.json(dongho)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})
module.exports = router