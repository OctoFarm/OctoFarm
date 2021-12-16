const mongoose = require("mongoose");

const AlertsSchema = new mongoose.Schema({
  active: {
    type: Boolean,
    required: true
  },
  printer: {
    type: Array,
    required: true
  },
  trigger: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  scriptLocation: {
    type: String,
    required: true
  }
});

const Alert = mongoose.model("Alerts", AlertsSchema);

module.exports = Alert;
