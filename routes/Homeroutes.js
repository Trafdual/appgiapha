const router = require("express").Router();
const VanKhan = require("../models/VanKhanModel");
const LoaiVanKhan = require("../models/LoaiVanKhanModel");
const Xam=require("../models/XamModels");
const GiacMong=require("../models/GiacmongModel");

router.get("/home",async(req,res)=>{
    try {
        const loaivankhan= await LoaiVanKhan.find();
        const xam=await Xam.find();
        const giacmong=await GiacMong.find();
        res.render("home",{loaivankhan,xam,giacmong})
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
})

module.exports=router