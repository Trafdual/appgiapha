const mongoose = require('mongoose');
const leanVirtual = require('mongoose-lean-virtuals');
const usergiaphaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  name: { type: String },
  nickname: { type: String },
  avatar: { type: String },
  sex: { type: String },
  date: { type: String },
  relationship: {type: String},
  maritalstatus: { type: String },
  phone: { type: String },
  academiclevel: { type: String },
  job: { type: String },
  address: { type: String },
  hometown: { type: String },
  bio: { type: String },
  dead: { type: Boolean },
  deadinfo: {
    deaddate: { type: String },
    lived: { type: String },
    worshipaddress: { type: String },
    worshipperson: { type: String },
    burialaddress: { type: String }
  },
  lineage: { type: mongoose.Schema.Types.ObjectId, ref: 'dongho' },
  con:[{type: mongoose.Schema.Types.ObjectId, ref: 'usergiapha' }]
});

usergiaphaSchema.plugin(leanVirtual);
const UserGiaPha = mongoose.model('usergiapha', usergiaphaSchema);
module.exports = UserGiaPha;
