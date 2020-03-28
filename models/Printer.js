const mongoose = require("mongoose");

const PrinterSchema = new mongoose.Schema({
  sortIndex: {
    type: Number,
    required: false
  },
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
  feedRate: {
    type: Number,
    required: false
  },
  flowRate: {
    type: Number,
    required: false
  },
  settingsApperance: {
    type: Object,
    required: false
  },
  selectedFilament: {
    type: Object,
    required: false
  }
});

const Printer = mongoose.model("Printer", PrinterSchema);

module.exports = Printer;
