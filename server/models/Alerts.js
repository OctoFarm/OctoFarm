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
  type: {
    // Change to required true when other endpoints are setup.
    type: String,
    required: false
  },
  scriptLocation: {
    type: String,
    required: true
  }
});

const Alert = mongoose.model("Alerts", AlertsSchema);

module.exports = Alert;
