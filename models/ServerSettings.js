const mongoose = require("mongoose");

const ServerSettingsSchema = new mongoose.Schema({
  onlinePolling: {
    type: Object,
    required: true
  },
  server: {
    type: Object,
    required: false
  },
  timeout: {
    type: Object,
    required: false
  },
  filamentManager: {
    type: Boolean,
    required: false
  }
});

const ServerSettings = mongoose.model("ServerSettings", ServerSettingsSchema);

module.exports = ServerSettings;
