const mongoose = require('mongoose');

const PreHeatListSchema = new mongoose.Schema({
    material: {
        type: Boolean,
        required: true,
    },
    density: {
        type: Number,
        required: true
    },
    toolTemperature: {
        type: Number,
        required: false
    },
    bedTemperature: {
        type: Number,
        require: false
    }
});

const PreHeatList = mongoose.model('PreHeatList', PreHeatListSchema);

module.exports = PreHeatList;
