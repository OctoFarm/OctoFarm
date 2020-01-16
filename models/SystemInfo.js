const mongoose = require("mongoose");

const SystemInfoSchema = new mongoose.Schema({
  osInfo: {
    type: Object,
    required: true
  },
  cpuInfo: {
    type: Object,
    required: true
  },
  cpuLoad: {
    type: Object,
    required: true
  },
  memoryInfo: {
    type: Object,
    required: true
  },
  memoryInfo: {
    type: Object,
    required: true
  },
  sysUptime: {
    type: Object,
    required: true
  },
  sysProcess: {
    type: Object,
    required: true
  }
});

const SystemInfo = mongoose.model("SystemInfo", SystemInfoSchema);

module.exports = SystemInfo;
