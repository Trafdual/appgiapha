const mongoose = require('mongoose');

const baivietSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    content: String,
    like: Number,
    isLiked: { type: Boolean, default: false },
    numberComment: Number,
    comment: [{
        userID: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        cmt: { type: String },
        date: { type: Date }
    }],
    images: [String],
    date: { type: Date }
});

const Baiviet = mongoose.model('baiviet', baivietSchema);
module.exports = Baiviet;