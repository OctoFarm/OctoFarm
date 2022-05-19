const mongoose = require("mongoose");

const userActionSchema = new mongoose.Schema({
  printerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Printer",
    required: true
  },
  action: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    required: false
  },
  date: {
    type: Date,
    required: true
  },
  currentUser: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: false
  },
  fullPath: {
    type: String,
    required: false
  }
});

const UserAction = mongoose.model("UserAction", userActionSchema);

module.exports = UserAction;
