
const mongoose = require('mongoose');

const vankhanSchema = new mongoose.Schema({
name:{type:String},
vankhan:[{type: mongoose.Schema.Types.ObjectId, ref: 'vankhan'}]
});

const VanKhan = mongoose.model('loaivankhan', vankhanSchema);
module.exports = VanKhan;
