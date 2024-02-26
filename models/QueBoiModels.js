const mongoose = require('mongoose');

const queboiSchema = new mongoose.Schema({
nameque:{type:Number},
content:{type:String},
idxam:{type: mongoose.Schema.Types.ObjectId, ref: 'xam'}
});

const Queboi = mongoose.model('queboi', queboiSchema);
module.exports = Queboi;
