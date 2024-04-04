const router = require("express").Router();
const VanKhan = require("../models/VanKhanModel");
const LoaiVanKhan = require("../models/LoaiVanKhanModel");
const Xam = require("../models/XamModels");
const Queboi=require("../models/QueBoiModels")
const GiacMong = require("../models/GiacmongModel");

router.get("/home", async (req, res) => {
    try {
        const loaivankhan = await LoaiVanKhan.find();
        const xam = await Xam.find();
        const giacmong = await GiacMong.find();
        res.render("home", { loaivankhan, xam, giacmong })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
})
router.get("/vankhanview/:idloai", async (req, res) => {
    try {
        const idloai = req.params.idloai
        const loaivankhan = await LoaiVanKhan.findById(idloai);
        const vankhanjson = await Promise.all(loaivankhan.vankhan.map(async (vk) => {
            const vankhan = await VanKhan.findById(vk._id);
            return {
                _id:vankhan._id,
                name: vankhan.name,
                gioithieu: vankhan.gioithieu,
                samle: vankhan.samle,
                vankhan: vankhan.vankhan,
                loai: vankhan.loai
            }
        }))
        res.render("vankhan", { vankhanjson, idloai })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
})

router.get("/queboiview/:idxam", async (req, res) => {
    try {
        const idxam = req.params.idxam
        const xam = await Xam.findById(idxam);
        const queboijson = await Promise.all(xam.queboi.map(async (qb) => {
            const queboi = await Queboi.findById(qb._id);
            return {
                _id:queboi._id,
                nameque: queboi.nameque,
                content: queboi.content
            }
        }))
        res.render("queboi", { queboijson, idxam })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
})



module.exports = router