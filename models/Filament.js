const mongoose = require("mongoose");

const RollSchema = new mongoose.Schema({
  spools: {
    type: Object,
    required: true
  },
});

const Spool = mongoose.model("Spool", RollSchema);

module.exports = Spool;
