const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema({
  print: {
    type: Object,
    required: true
  }
});

const History = mongoose.model("History", HistorySchema);

module.exports = History;
