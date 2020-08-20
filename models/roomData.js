const mongoose = require("mongoose");

const RoomDataSchema = new mongoose.Schema({
    date:{
        type: Date,
        required: true,
    },
    temperature: {
        type: Number,
        required: true,
    },
    pressure: {
        type: Number,
        required: true,
    },
    humidity: {
        type: Number,
        required: true,
    },
    iaq: {
        type: Number,
        required: true,
    }
},{ capped : true, size:10000, max : 900000 });

const RoomData = mongoose.model("RoomData", RoomDataSchema);

module.exports = RoomData;
