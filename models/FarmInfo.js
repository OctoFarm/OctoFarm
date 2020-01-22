const mongoose = require("mongoose");

const FarmInfoSchema = new mongoose.Schema({
  farmInfo: {
    type: Object,
    required: false
  },
  farmStatistics: {
    type: Object,
    required: false
  },
  printStatistics: {
    type: Object,
    required: false
  }

});

const FarmInfo = mongoose.model("FarmInfo", FarmInfoSchema);

module.exports = FarmInfo;
