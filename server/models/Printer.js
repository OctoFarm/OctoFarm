const mongoose = require("mongoose");

const PrinterSchema = new mongoose.Schema({
  disabled: {
    type: Boolean,
    required: true,
    default: false
  },
  apikey: {
    type: String,
    required: true // !
  },
  camURL: {
    type: String,
    required: false
  },
  printerURL: {
    type: String,
    required: true // !
  },
  webSocketURL: {
    type: String,
    required: false // !
  },
  printerName: {
    type: String,
    required: false
  },
  sortIndex: {
    type: Number,
    required: false
  },
  // Onboarding flags:
  onboarding: {
    fullyScanned: {
      type: Boolean,
      required: true,
      default: false
    },
    // Required Flags
    userApi: {
      type: Boolean,
      required: true,
      default: false
    },
    settingsApi: {
      type: Boolean,
      required: true,
      default: false
    },
    systemApi: {
      type: Boolean,
      required: true,
      default: false
    },
    profileApi: {
      type: Boolean,
      required: true,
      default: false
    },
    stateApi: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  // Auto-generated below
  settingsAppearance: {
    type: Object,
    required: false
  },
  printerFirmware: {
    type: String,
    required: false
  },
  currentUser: {
    type: String,
    required: false
  },
  userList: {
    type: Array,
    required: false
  },
  dateAdded: {
    type: Number,
    required: false
  },
  fileList: {
    type: Object,
    required: false
  },
  octoPrintSystemInfo: {
    type: Object,
    require: false
  },
  octoPi: {
    type: Object,
    require: false
  },
  powerSettings: {
    type: Object,
    required: false
  },
  costSettings: {
    type: Object,
    required: false
  },
  tempTriggers: {
    type: Object,
    required: false
  },
  feedRate: {
    type: Number,
    required: false
  },
  flowRate: {
    type: Number,
    required: false
  },
  selectedFilament: {
    type: Object,
    required: false
  },
  currentIdle: {
    type: Number,
    required: false
  },
  currentActive: {
    type: Number,
    required: false
  },
  currentOffline: {
    type: Number,
    required: false
  },
  category: {
    type: String,
    required: false,
    default: "OctoPrint"
  },
  ip: {
    type: String,
    required: false
  },
  port: {
    type: Number,
    required: false
  },
  octoPrintVersion: {
    type: String,
    required: false
  },
  klipperFirmwareVersion: {
    type: String,
    required: false
  },
  group: {
    type: String,
    required: false
  },
  storage: {
    type: Object,
    required: false
  },
  current: {
    type: Object,
    required: false
  },
  options: {
    type: Object,
    required: false
  },
  profiles: {
    type: Object,
    required: false
  },
  pluginsListDisabled: {
    type: Array,
    required: false
  },
  pluginsListEnabled: {
    type: Array,
    required: false
  },
  octoPrintUpdate: {
    type: Object,
    required: false
  },
  octoPrintPluginUpdates: {
    type: Array,
    required: false
  },
  corsCheck: {
    type: Boolean,
    required: false
  },
  settingsApi: {
    type: Object,
    required: false
  },
  settingsFeature: {
    type: Object,
    required: false
  },
  settingsFolder: {
    type: Object,
    required: false
  },
  settingsPlugins: {
    type: Object,
    required: false
  },
  settingsScripts: {
    type: Object,
    required: false
  },
  settingsSerial: {
    type: Object,
    required: false
  },
  settingsServer: {
    type: Object,
    required: false
  },
  settingsSystem: {
    type: Object,
    required: false
  },
  settingsWebcam: {
    type: Object,
    required: false
  },
  core: {
    type: Array,
    required: false
  },
  activeControlUser: {
    type: String,
    required: false
  },
  quickConnectSettings: {
    type: Object,
    required: false
  }
});

const Printer = mongoose.model("Printer", PrinterSchema);

module.exports = Printer;
