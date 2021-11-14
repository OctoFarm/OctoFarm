const mongoose = require("mongoose");

const CustomGcodeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  gcode: {
    type: Array,
    required: true
  },
  buttonColour: {
    type: String,
    required: false
  },
  printerIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Printer"
    }
  ]
});

const CustomGcode = mongoose.model("CustomGcode", CustomGcodeSchema);

module.exports = CustomGcode;
