const mongoose = require("mongoose");

const PluginLogsSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    printerID: {
      type: String,
      required: true
    },
    printerURL: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pluginDisplay: {
      type: String,
      required: true
    }
  },
  { capped: true, size: 10000, max: 1000000, autoIndexId: true }
);

const PluginLogs = mongoose.model("PluginLogs", PluginLogsSchema);

module.exports = PluginLogs;
