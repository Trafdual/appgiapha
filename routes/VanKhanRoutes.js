const router = require("express").Router();
const VanKhan = require("../models/VanKhanModel");
const LoaiVanKhan = require("../models/LoaiVanKhanModel");

router.post('/postloaivankhan', async (req, res) => {
    try {
        const { name } = req.body;
        const loaivankhan = new LoaiVanKhan({ name });
        await loaivankhan.save();
        res.json(loaivankhan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
})

router.post('/putloaivankhan/:idloaivankhan', async (req, res) => {
    try {
        const { name } = req.body;
        const idloaivankhan = req.params.idloaivankhan;
        const loaivankhan = await LoaiVanKhan.findById(idloaivankhan);

        const vankhan = await VanKhan.updateMany({ loai: loaivankhan.name }, { $set: { loai: name } });

        loaivankhan.name = name;
        await loaivankhan.save();

        res.json({ message: 'Cập nhật thành công.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
});

router.get('/getloaivankhan', async (req, res) => {
    try {
        const loaivankhan = await LoaiVanKhan.find();
        const loaidata = loaivankhan.map(data => {
            return {
                id: data._id,
                name: data.name
            }
        })
        res.json(loaidata);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
})



router.post('/postvankhan', async (req, res) => {
    try {
        const { name, gioithieu, samle, vankhan, loai } = req.body;
        const vankhann = new VanKhan({ name, gioithieu, samle, vankhan, loai });
        const loaivankhan = await LoaiVanKhan.findOne({ name: loai });
        if(!loaivankhan){
            return res.status(400).json({ message: 'loại văn khấn không tồn tại' });
        }
        loaivankhan.vankhan.push(vankhann._id);
        await vankhann.save();
        await loaivankhan.save();
        res.json(vankhann);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
});



router.get('/getvankhan/:idloaivankhan', async (req, res) => {
    try {
        const idloaivankhan = req.params.idloaivankhan;
        const loaivankhan = await LoaiVanKhan.findById(idloaivankhan);
        const vankhandata = await Promise.all(loaivankhan.vankhan.map(async (data) => {
            const vankhan = await VanKhan.findById(data._id);
            return {
                id: vankhan._id,
                name: vankhan.name,
                loai:vankhan.loai
            }
        }))
        res.json(vankhandata);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
})

router.get('/getchitietvankhan/:idvankhan', async (req, res) => {
    try {
        const idvankhan = req.params.idvankhan;
        const vankhan = await VanKhan.findById(idvankhan);
        const vankhandata = {
            id: vankhan._id,
            name: vankhan.name,
            gioithieu: vankhan.gioithieu,
            samle: vankhan.samle,
            vankhan: vankhan.vankhan
        }
        res.json(vankhandata);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
})


module.exports = router