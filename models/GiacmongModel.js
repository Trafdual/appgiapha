const mongoose = require('mongoose');

const dreamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
});

const Dream = mongoose.model('Dream', dreamSchema);

module.exports = Dream;
