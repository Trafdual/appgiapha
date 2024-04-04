const router = require("express").Router();
const VanKhan = require("../models/VanKhanModel");
const LoaiVanKhan = require("../models/LoaiVanKhanModel");
router.post('/postloaivankhan', async (req, res) => {
    try {
        const { name } = req.body;
        const loaivankhan = new LoaiVanKhan({ name });
        await loaivankhan.save();
        res.redirect('/home');
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

        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
});

router.post('/deleteloaivankhan/:id', async (req, res) => {
    try {
        const idloaivankhan = req.params.id;
        const loaivankhan = await LoaiVanKhan.findById(idloaivankhan);

        await Promise.all(loaivankhan.vankhan.map(async (vk) => {
            await VanKhan.findByIdAndDelete(vk._id);
        }))
        await loaivankhan.deleteOne({ _id: idloaivankhan });
        res.redirect('/home')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
})

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



router.post('/postvankhan/:idloai', async (req, res) => {
    try {
        const { name, gioithieu, samle, vankhan } = req.body;
        const idloai = req.params.idloai;
        const vankhann = new VanKhan({ name, gioithieu, samle, vankhan });
        const loaivankhan = await LoaiVanKhan.findById(idloai);
        vankhann.loai = loaivankhan.name;
        loaivankhan.vankhan.push(vankhann._id);
        await vankhann.save();
        await loaivankhan.save();
        res.redirect(`/vankhanview/${idloai}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
});

router.post('/putvankhan/:idvankhan', async (req, res) => {
    try {
        const { name, gioithieu, samle, vankhan } = req.body;
        const idvankhan = req.params.idvankhan;
        const vankhann=await VanKhan.findById(idvankhan);
        const loaivankhan=await LoaiVanKhan.findOne({name:vankhann.loai});
        vankhann.name=name;
        vankhann.gioithieu=gioithieu;
        vankhann.samle=samle;
        vankhann.vankhan=vankhan;
        await vankhann.save();
        res.redirect(`/vankhanview/${loaivankhan._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
});

router.post('/deletevankhan/:idvankhan/:idloai',async(req,res)=>{
    try {
        const idvankhan = req.params.idvankhan;
        const idloai=req.params.idloai;
        const vankhann=await VanKhan.findById(idvankhan);
        const loaivankhan=await LoaiVanKhan.findById(idloai);
        loaivankhan.vankhan=loaivankhan.vankhan.filter(vankhan=>vankhan.toString() !== idvankhan);
        await loaivankhan.save();
        await vankhann.deleteOne({_id:idvankhan});
        res.redirect(`/vankhanview/${idloai}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
})



router.get('/getvankhan/:idloaivankhan', async (req, res) => {
    try {
        const idloaivankhan = req.params.idloaivankhan;
        const loaivankhan = await LoaiVanKhan.findById(idloaivankhan);
        const vankhandata = await Promise.all(loaivankhan.vankhan.map(async (data) => {
            const vankhan = await VanKhan.findById(data._id);
            return {
                id: vankhan._id,
                name: vankhan.name,
                loai: vankhan.loai
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