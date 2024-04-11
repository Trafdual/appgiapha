const mongoose = require('mongoose');
const leanVirtua = require('mongoose-lean-virtuals');
const donghoSchema = new mongoose.Schema({
name:{type:String},
key:{type:String},
address:{type:String},
user:[{ type: mongoose.Schema.Types.ObjectId, ref: 'usergiapha' }],
userId:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}],
baiviet:[{type:mongoose.Schema.Types.ObjectId, ref:'baiviet'}]
});
donghoSchema.plugin(leanVirtua);
const DongHo = mongoose.model('dongho', donghoSchema);
module.exports = DongHo;
