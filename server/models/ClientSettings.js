const mongoose = require("mongoose");

const ClientSettingsSchema = new mongoose.Schema({
  dashboard: {
    defaultLayout: [
      {
        x: {
          type: Number,
          required: true
        },
        y: {
          type: Number,
          required: true
        },
        width: {
          type: Number,
          required: true
        },
        height: {
          type: Number,
          required: true
        },
        id: {
          type: String,
          required: true
        }
      }
    ],
    savedLayout: {
      type: Array
    },
    farmActivity: {
      currentOperations: {
        type: Boolean,
        required: true,
        default: true
      },
      cumulativeTimes: {
        type: Boolean,
        required: true,
        default: true
      },
      averageTimes: {
        type: Boolean,
        required: true,
        default: true
      }
    },
    printerStates: {
      printerState: {
        type: Boolean,
        required: true,
        default: true
      },
      printerTemps: {
        type: Boolean,
        required: true,
        default: true
      },
      printerUtilisation: {
        type: Boolean,
        required: true,
        default: true
      },
      printerProgress: {
        type: Boolean,
        required: true,
        default: true
      },
      currentStatus: {
        type: Boolean,
        required: true,
        default: true
      }
    },
    farmUtilisation: {
      currentUtilisation: {
        type: Boolean,
        required: true,
        default: true
      },
      farmUtilisation: {
        type: Boolean,
        required: true,
        default: true
      }
    },
    historical: {
      weeklyUtilisation: {
        type: Boolean,
        required: true,
        default: true
      },
      hourlyTotalTemperatures: {
        type: Boolean,
        required: true,
        default: true
      },
      environmentalHistory: {
        type: Boolean,
        required: true,
        default: false
      },
      historyCompletionByDay: {
        type: Boolean,
        required: true,
        default: false
      },
      filamentUsageByDay: {
        type: Boolean,
        required: true,
        default: false
      },
      filamentUsageOverTime: {
        type: Boolean,
        required: true,
        default: false
      }
    },
    other: {
      timeAndDate: {
        type: Boolean,
        required: true,
        default: false
      },
      cameraCarousel: {
        type: Boolean,
        required: true,
        default: false
      }
    }
  },
  views: {
    currentOperations: {
      type: Boolean,
      required: true,
      default: true
    },
    showOffline: {
      type: Boolean,
      required: true,
      default: false
    },
    showDisconnected: {
      type: Boolean,
      required: true,
      default: true
    },
    cameraColumns: {
      type: Number,
      required: true,
      default: 3
    },
    groupColumns: {
      type: Number,
      required: true,
      default: 4
    }
  },
  fileManager: {
    currentOperations: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  printerManager: {
    currentOperations: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  filamentManager: {
    currentOperations: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  history: {
    currentOperations: {
      type: Boolean,
      required: true,
      default: false
    }
  }
});

const ClientSettings = mongoose.model("ClientSettings", ClientSettingsSchema);

module.exports = ClientSettings;
