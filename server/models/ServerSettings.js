const mongoose = require('mongoose');

const ServerSettingsSchema = new mongoose.Schema({
  server: {
    loginRequired: {
      type: Boolean,
      default: true,
      required: true,
    },
    registration: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  timeout: {
    // When to retry the connections, this is a base for the
    apiRetry: {
      type: Number,
      default: 30000,
      required: true,
    },
    // When to try reconnecting the websocket...
    webSocketRetry: {
      type: Number,
      default: 5000,
      required: true,
    },
  },
  filament: {
    filamentCheck: {
      type: Boolean,
      default: false,
      required: true,
    },
    downDateSuccess: {
      type: Boolean,
      default: false,
      required: true,
    },
    downDateFailed: {
      type: Boolean,
      default: false,
      required: true,
    },
    hideEmpty: {
      type: Boolean,
      default: false,
      required: true,
    },
    allowMultiSelect: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  history: {
    snapshot: {
      onComplete: {
        type: Boolean,
        default: false,
        required: true,
      },
      onFailure: {
        type: Boolean,
        default: false,
        required: true,
      },
    },
    thumbnails: {
      onComplete: {
        type: Boolean,
        default: false,
        required: true,
      },
      onFailure: {
        type: Boolean,
        default: false,
        required: true,
      },
    },
    timelapse: {
      onComplete: {
        type: Boolean,
        default: false,
        required: true,
      },
      onFailure: {
        type: Boolean,
        default: false,
        required: true,
      },
      deleteAfter: {
        type: Boolean,
        default: false,
        required: true,
      },
    },
  },
  influxExport: {
    active: {
      type: Boolean,
      default: false,
      required: true,
    },
    host: {
      type: String,
    },
    port: {
      type: String,
    },
    database: {
      type: String,
    },
    username: {
      type: String,
    },
    password: {
      type: String,
    },
    retentionPolicy: {
      defaultRet: {
        type: Boolean,
      },
    },
  },
  monitoringViews: {
    panel: {
      type: Boolean,
      required: true,
      default: true,
    },
    list: {
      type: Boolean,
      required: true,
      default: true,
    },
    camera: {
      type: Boolean,
      required: true,
      default: true,
    },
    group: {
      type: Boolean,
      required: true,
      default: false,
    },
    currentOperations: {
      type: Boolean,
      required: true,
      default: false,
    },
    combined: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  cameras: {
    proxyEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    aspectRatio: {
      type: String,
      required: true,
      default: '0',
    },
    updateInterval: {
      type: Number,
      required: true,
      default: 10000,
    },
  },
  dashboardDisplay: {
    type: Boolean,
    required: true,
    default: false
  }
});

const ServerSettings = mongoose.model('ServerSettings', ServerSettingsSchema);

module.exports = ServerSettings;
