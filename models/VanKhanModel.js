const mongoose = require('mongoose');

const vankhanSchema = new mongoose.Schema({
name:{type:String},
gioithieu:{type:String},
samle:{type:String},
vankhan:{type:String},
loai:{type:String}
});

const VanKhan = mongoose.model('vankhan', vankhanSchema);
module.exports = VanKhan;