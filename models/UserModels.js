const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  success:{type:Boolean,enum:[true], default:true},
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  hovaten:{type:String},
  date:{type:String},
  yearsold:{type:String},
  role: { type: String, enum: ['admin','user'], default: 'admin' },
  address:{
    wards:{type:String},
    districts:{type:String},
    city:{type:String}
  },
  hometown:{
    wards:{type:String},
    districts:{type:String},
    city:{type:String}
  },
  avatar:{type:String},
  phone:{type:String},
  job:{type:String}
});

const User = mongoose.model('user', userSchema);
module.exports = User;
