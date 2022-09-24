const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const HistorySchema = new mongoose.Schema({
  printHistory: {
    printerName: {
      type: String,
      required: true,
    },
    printerID: {
      type: String,
      required: true,
    },
    printerGroup: {
      type: String,
      required: true,
    },
    costSettings: {
      powerConsumption: {
        type: Number,
        required: true,
      },
      electricityCosts: {
        type: Number,
        required: true,
      },
      purchasePrice: {
        type: Number,
        required: true,
      },
      estimateLifespan: {
        type: Number,
        required: true,
      },
      maintenanceCosts: {
        type: Number,
        required: true,
      },
    },
    success: {
      type: Boolean,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    printTime: {
      type: Number,
      required: true,
    },
    filamentSelection: [
      {
        _id: {
          type: String,
          required: true,
        },
        spools: {
          name: {
            type: String,
            required: true,
          },
          profile: {
            index: {
              type: Number,
              required: false,
            },
            manufacturer: {
              type: String,
              required: true,
            },
            material: {
              type: String,
              required: true,
            },
            density: {
              type: Number,
              required: true,
            },
            diameter: {
              type: Number,
              required: true,
            },
          },
          price: {
            type: Number,
            required: true,
          },
          weight: {
            type: Number,
            required: true,
          },
          used: {
            type: Number,
            required: true,
          },
          tempOffset: {
            type: Number,
            required: true,
          },
          bedOffset: {
            type: Number,
            required: true,
          },
          fmID: {
            type: Number,
            required: false,
          },
        },
      },
    ],
    job: {
      file: {
        name: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        display: {
          type: String,
          required: true,
        },
        origin: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        date: {
          type: Number,
          required: true,
        },
      },
      estimatedPrintTime: {
        type: Number,
        required: true,
      },
      averagePrintTime: {
        type: Number,
        required: true,
      },
      lastPrintTime: {
        type: Number,
        required: true,
      },
      filament: {
        type: Object,
        required: true,
      },
      user: {
        type: String,
        required: true,
      },
    },
    notes: {
      type: String,
      required: false,
    },
    snapshot: {
      type: String,
      required: false,
    },
    timelapse: {
      type: String,
      required: false,
    },
    resends: {
      count: {
        type: Number,
        required: false,
      },
      transmitted: {
        type: Number,
        required: false,
      },
      ratio: {
        type: Number,
        required: false,
      },
    },
    activeControlUser: {
      type: String,
      required: true,
    },
  },
});

HistorySchema.plugin(mongoosePaginate);

const History = mongoose.model('History', HistorySchema);

module.exports = History;
