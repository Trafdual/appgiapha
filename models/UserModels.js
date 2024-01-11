const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  success: { type: Boolean, enum: [true], default: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  hovaten: { type: String },
  avatar: { type: String },
  date: { type: String },
  yearsold: { type: String },
  role: { type: String, enum: ['admin', 'user'], default: 'admin' },
  address: { type: String },
  hometown: { type: String },
  avatar: { type: String },
  phone: { type: String },
  job: { type: String },
  baiviet: [{ type: mongoose.Schema.Types.ObjectId, ref: 'baiviet' }],
  favoriteBaiviet: [{
    baivietId: { type: mongoose.Schema.Types.ObjectId, ref: 'baiviet' },
    isLiked: { type: Boolean, default: false },
  }],
});

const User = mongoose.model('user', userSchema);
module.exports = User;
