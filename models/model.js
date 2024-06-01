
const mongoose = require('mongoose');
const Ably=require('ably');

const modelSchema = new mongoose.Schema({
name:{type:String},
color:{type:String},
imel:{type:String},
dungluong:{type:String}
});

const Model = mongoose.model('model', modelSchema);
// const ably = new Ably.Realtime('vWlvGg.-XYngQ:bObD8PvuyKQy28aXFmdJC4-qzaicOq3P6vTGyToHrds'); // Thay YOUR_ABLY_API_KEY bằng khóa API của bạn
// const channel = ably.channels.get('hello'); // Thay YOUR_CHANNEL_NAME bằng tên kênh của bạn
// channel.attach();
// modelSchema.post('save', function (doc) {
//   const data = {
//     _id: doc._id,
//     name: doc.name,
//     color: doc.color,
//     imel: doc.imel,
//     dungluong: doc.dungluong
//   };
  
//   channel.publish('update', JSON.stringify(data));
// });
module.exports = Model;
