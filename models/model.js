
const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
name:{type:String},
});

const Model = mongoose.model('model', modelSchema);
module.exports = Model;
