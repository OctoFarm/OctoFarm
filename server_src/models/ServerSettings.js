const mongoose = require("mongoose");

const ServerSettingsSchema = new mongoose.Schema({
  onlinePolling: {
    seconds: {
      type: String,
      default: "0.5",
      required: true
    }
  },
  server: {
    port: {
      type: Number,
      default: 4000,
      required: true
    },
    loginRequired: {
      type: Boolean,
      default: true,
      required: true
    },
    registration: {
      type: Boolean,
      default: true,
      required: true
    }
  },
  timeout: {
    apiTimeout: {
      type: Number,
      default: 1000,
      required: true
    },
    apiRetryCutoff: {
      type: Number,
      default: 10000,
      required: true
    },
    apiRetry: {
      type: Number,
      default: 30000,
      required: true
    },
    webSocketRetry: {
      type: Number,
      default: 5000,
      required: true
    }
  },
  filamentManager: {
    type: Boolean,
    default: false,
    required: false
  },
  filament: {
    filamentCheck: {
      type: Boolean,
      default: false,
      require: true
    },
    downDateSuccess: {
      type: Boolean,
      default: false,
      require: true
    },
    downDateFailed: {
      type: Boolean,
      default: false,
      require: true
    }
  },
  history: {
    snapshot: {
      onComplete: {
        type: Boolean,
        default: false,
        required: true
      },
      onFailure: {
        type: Boolean,
        default: false,
        required: true
      }
    },
    thumbnails: {
      onComplete: {
        type: Boolean,
        default: false,
        required: true
      },
      onFailure: {
        type: Boolean,
        default: false,
        required: true
      }
    },
    timelapse: {
      onComplete: {
        type: Boolean,
        default: false,
        required: true
      },
      onFailure: {
        type: Boolean,
        default: false,
        required: true
      },
      deleteAfter: {
        type: Boolean,
        default: false,
        required: true
      }
    }
  },
  influxExport: {
    active: {
      type: Boolean,
      default: false,
      required: true
    },
    host: {
      type: String
    },
    port: {
      type: String
    },
    database: {
      type: String
    },
    username: {
      type: String
    },
    password: {
      type: String
    },
    retentionPolicy: {
      defaultRet: {
        type: Boolean
      }
    }
  },
  monitoringViews: {
    panel: {
      type: Boolean,
      required: true,
      default: true
    },
    list: {
      type: Boolean,
      required: true,
      default: true
    },
    camera: {
      type: Boolean,
      required: true,
      default: true
    },
    group: {
      type: Boolean,
      required: true,
      default: false
    },
    currentOperations: {
      type: Boolean,
      required: true,
      default: false
    },
    combined: {
      type: Boolean,
      required: true,
      default: false
    }
  }
});

const ServerSettings = mongoose.model("ServerSettings", ServerSettingsSchema);

module.exports = ServerSettings;
