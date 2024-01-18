
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: { type: String },
    date: { type: String },
});

const Event = mongoose.model('event', eventSchema);
module.exports = Event;
