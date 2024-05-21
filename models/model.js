
const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
name:{type:String},
color:{type:String},
imel:{type:String},
dungluong:{type:String}
});

const Model = mongoose.model('model', modelSchema);
module.exports = Model;
