const mongoose = require("mongoose");

const ClientSettingsSchema = new mongoose.Schema({
  settings: {
    type: Object,
    required: true
  },
  panelView: {
    type: Object,
    required: true
  },
  listView: {
    type: Object,
    required: true
  },
  cameraView: {
    type: Object,
    required: true
  },
  operations: {
    type: Object,
    required: true
  },
  filaManager: {
    type: Object,
    required: true
  }
});

const ClientSettings = mongoose.model("ClientSettings", ClientSettingsSchema);

module.exports = ClientSettings;
