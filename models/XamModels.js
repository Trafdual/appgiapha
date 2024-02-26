const mongoose = require('mongoose');

const xamSchema = new mongoose.Schema({
name:{type:String},
queboi:[{ type: mongoose.Schema.Types.ObjectId, ref: 'queboi' }],
});

const Xam = mongoose.model('xam', xamSchema);
module.exports = Xam;
