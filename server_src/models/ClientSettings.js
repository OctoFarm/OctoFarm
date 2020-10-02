const mongoose = require("mongoose");

const ClientSettingsSchema = new mongoose.Schema({
  settings: {
    type: Object,
    required: false
  },
  dashboard: {
    type: Object,
    required: false
  },
  panelView: {
    type: Object,
    required: false
  },
  listView: {
    type: Object,
    required: false
  },
  cameraView: {
    type: Object,
    required: false
  },
  operations: {
    type: Object,
    required: false
  },
  filaManager: {
    type: Object,
    required: false
  }
});

const ClientSettings = mongoose.model("ClientSettings", ClientSettingsSchema);

module.exports = ClientSettings;
