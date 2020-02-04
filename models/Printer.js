const mongoose = require("mongoose");

const PrinterSchema = new mongoose.Schema({
  index: {
    type: Number,
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  port: {
    type: String,
    required: true
  },
  apikey: {
    type: String,
    required: true
  },
  camURL: {
    type: String,
    required: false
  },
  stateColour: {
    type: Object,
    required: false
  },
  data: {
    type: Object,
    required: false
  }
});

const Printer = mongoose.model("Printer", PrinterSchema);

module.exports = Printer;
