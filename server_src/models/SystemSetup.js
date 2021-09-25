const mongoose = require("mongoose");
const { COLLECTIONS } = require("../constants/database.constants");

const ServerSetupSchema = new mongoose.Schema(
  {
    isSetup: {
      type: Boolean,
      default: false,
      required: true
    },
    isSystemChecksDone: {
      type: Boolean,
      default: false,
      required: true
    },
    isAdminCreated: {
      type: Boolean,
      default: false,
      required: true
    },
    isAdditionalUsersDone: {
      type: Boolean,
      default: false,
      required: true
    },
    isCustomisationDone: {
      type: Boolean,
      default: false,
      required: true
    }
  },
  {
    collection: COLLECTIONS.SERVER_SETUP
  }
);

const SystemSetup = mongoose.model("SystemSetup", ServerSetupSchema);
module.exports = SystemSetup;
