const mongoose = require('mongoose');

const donghoSchema = new mongoose.Schema({
name:{type:String},
key:{type:String},
user:[{ type: mongoose.Schema.Types.ObjectId, ref: 'usergiapha' }]
});

const DongHo = mongoose.model('dongho', donghoSchema);
module.exports = DongHo;
