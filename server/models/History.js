const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const HistorySchema = new mongoose.Schema({
  printHistory: {
    type: Object,
    required: true
  }
});

HistorySchema.plugin(mongoosePaginate);

const History = mongoose.model("History", HistorySchema);

module.exports = History;
