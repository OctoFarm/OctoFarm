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
  inited: {
    type: Boolean,
    required: false
  },
  action: {
    type: String,
    required: false
  },
  current: {
    type: Object,
    required: false
  },
  options: {
    type: Object,
    required: false
  },
  storage: {
    type: Object,
    required: false
  },
  stateColour: {
    type: Object,
    required: false
  },
  fileList: {
    type: Object,
    required: false
  },
  job: {
    type: Object,
    required: false
  },
  progress: {
    type: Object,
    required: false
  },
  temperature: {
    type: Object,
    required: false
  },
  profiles: {
    type: Object,
    required: false
  },
  settingsAPI: {
    type: Object,
    required: false
  },
  settingsApperance: {
    type: Object,
    required: false
  },
  settingsFeature: {
    type: Object,
    required: false
  },
  settingsFolder: {
    type: Object,
    required: false
  },
  settingsPlugins: {
    type: Object,
    required: false
  },
  settingsScripts: {
    type: Object,
    required: false
  },
  settingsSerial: {
    type: Object,
    required: false
  },
  settingsServer: {
    type: Object,
    required: false
  },
  settingsSystem: {
    type: Object,
    required: false
  },
  settingsWebcam: {
    type: Object,
    required: false
  },
  core: {
    type: Object,
    required: false
  }
});

const Printer = mongoose.model("Printer", PrinterSchema);

module.exports = Printer;
