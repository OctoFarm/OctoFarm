const mongoose = require("mongoose");

const RollSchema = new mongoose.Schema({
  roll: {
    type: Object,
    required: true
  }
});
const Roll = mongoose.model("Roll", RollSchema);

module.exports = Roll;
