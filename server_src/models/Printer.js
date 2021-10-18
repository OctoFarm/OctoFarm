const mongoose = require("mongoose");

const PrinterSchema = new mongoose.Schema({
  apikey: {
    type: String,
    required: true // !
  },
  camURL: {
    type: String,
    required: false
  },
  printerURL: {
    type: String,
    required: true // !
  },
  webSocketURL: {
    type: String,
    required: false // !
  },
  sortIndex: {
    type: Number,
    required: false
  },
  // Auto-generated below
  settingsAppearance: {
    type: Object,
    required: false
  },
  currentUser: {
    type: String,
    required: false
  },
  dateAdded: {
    type: Number,
    required: false
  },
  fileList: {
    type: Object,
    required: false
  },
  // Non-essentials below
  powerSettings: {
    type: Object,
    required: false
  },
  costSettings: {
    type: Object,
    required: false
  },
  tempTriggers: {
    type: Object,
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
  selectedFilament: {
    type: Object,
    required: false
  },
  currentIdle: {
    type: Number,
    required: false
  },
  currentActive: {
    type: Number,
    required: false
  },
  currentOffline: {
    type: Number,
    required: false
  },
  category: {
    type: String,
    required: false
  },
  type: {
    type: String,
    required: false
  },
  ip: {
    type: String,
    required: false
  },
  port: {
    type: Number,
    required: false
  },
  octoPrintVersion: {
    type: String,
    required: false
  },
  klipperFirmwareVersion: {
    type: String,
    required: false
  },
  group: {
    type: String,
    required: false
  },
  storage: {
    type: Object,
    required: false
  }
});

const Printer = mongoose.model("Printer", PrinterSchema);

module.exports = Printer;
