const mongoose = require('mongoose');

const donghoSchema = new mongoose.Schema({
name:{type:String},
key:{type:String},
address:{type:String},
user:[{ type: mongoose.Schema.Types.ObjectId, ref: 'usergiapha' }],
userId:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}]
});

const DongHo = mongoose.model('dongho', donghoSchema);
module.exports = DongHo;
