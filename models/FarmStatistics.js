const mongoose = require("mongoose");

const FarmInfoSchema = new mongoose.Schema({
  farmStart: {
    type: Date,
    default: Date.now
  },
  farmInfo: {
    type: Object,
    required: false
  },
  octofarmStatistics: {
    type: Object,
    required: false
  },
  printStatistics: {
    type: Object,
    required: false
  },
  currentOperationsCount: {
    type: Array,
    required: false
  },
  currentOperations: {
    type: Array,
    required: false
  }
});

const FarmInfo = mongoose.model("FarmInfo", FarmInfoSchema);

module.exports = FarmInfo;
