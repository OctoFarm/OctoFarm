const mongoose = require("mongoose");

const ServerSettingsSchema = new mongoose.Schema({
  onlinePolling: {
    type: Object,
    required: true
  }
});

const ServerSettings = mongoose.model("ServerSettings", ServerSettingsSchema);

module.exports = ServerSettings;
