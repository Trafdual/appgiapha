const express = require('express');
const router = express.Router();
const Xam = require("../models/XamModels");
const Queboi = require("../models/QueBoiModels");


router.post('/xam', async (req, res) => {
    try {
        const { name } = req.body
        const xam = new Xam({ name });
        await xam.save();
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
    }
});

router.get('/getfullxam', async (req, res) => {
    try {
        const xams = await Xam.find();
        const xamjson = await Promise.all(xams.map(async (xam) => {
            return {
                id: xam._id,
                name: xam.name,
                queboi:xam.queboi
            }
        }));
        res.json(xamjson);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
    }
})

router.post('/deletexam/:idxam', async (req, res) => {
    try {
        const idxam = req.params.idxam;
        const xam = await Xam.findById(idxam);
        if (!xam) {
            res.status(403).json({ message: 'khong tim thay xam' })
        }
        await Promise.all(xam.queboi.map(async (queboi) => {
            await Queboi.findByIdAndDelete(queboi._id);
        }));
        await Xam.deleteOne({_id:idxam});
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
    }
})

router.post('/updatexam/:idxam',async(req,res)=>{
    try {
        const idxam = req.params.idxam;
        const {name}=req.body;
        const xam = await Xam.findByIdAndUpdate(idxam,{name});
        if (!xam) {
            res.status(403).json({ message: 'khong tim thay xam' })
        }
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
    }
})

router.post('/postqueboi/:idxam', async (req, res) => {
    try {
        const idxam = req.params.idxam;
        const { nameque, content } = req.body;
        const queboi = new Queboi({ nameque, content,idxam });
        const xam = await Xam.findById(idxam);
        if (!xam) {
            res.status(403).json({ message: 'khong tim thay xam' })
        }
        xam.queboi.push(queboi._id);
        await queboi.save();
        await xam.save();
        res.redirect(`/queboiview/${idxam}`)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
    }
})

router.get('/getqueboi/:idxam', async (req, res) => {
    try {
        const idxam = req.params.idxam;
        const xam = await Xam.findById(idxam);
        if (!xam) {
            res.status(403).json({ message: 'khong tim thay xam' })
        }
        const queboijson = await Promise.all(xam.queboi.map(async (queboi) => {
            const queboidata = await Queboi.findById(queboi._id)
            return {
                id: queboidata._id,
                tenque: queboidata.nameque,
                tenxam: xam.name,
                noidung: queboidata.content
            }
        }));
        queboijson.sort((a, b) => a.tenque - b.tenque);
        res.json(queboijson)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
    }
})

router.post('/deletequeboi/:idque', async (req, res) => {
    try {
        const idque = req.params.idque;
        const queboi = await Queboi.findById(idque);
        if (!queboi) {
            return res.status(404).json({ message: "Không tìm thấy quẻ bói." });
        }

        await Queboi.deleteOne({ _id: idque });

        const updatedXam = await Xam.findByIdAndUpdate(
            queboi.idxam,
            { $pull: { queboi: idque } },
            { new: true }
        );

        res.redirect(`/queboiview/${queboi.idxam}`)

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
    }
})

router.post('/updatequeboi/:idque',async(req,res)=>{
    try {
        const {nameque,content}=req.body
        const idque = req.params.idque;
        let updateFields = {};
        if (nameque) {
            updateFields.nameque = nameque;
        }
        if (content) {
            updateFields.content = content;
        }

        const queboi = await Queboi.findByIdAndUpdate(idque, updateFields, { new: true });
        if (!queboi) {
            return res.status(404).json({ message: "Không tìm thấy quẻ bói." });
        }
        res.redirect(`/queboiview/${queboi.idxam}`)

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
    }
})

module.exports = router;