const mongoose = require('mongoose');

const SpoolSchema = new mongoose.Schema({
  spools: {
    name: {
      type: String,
      required: true,
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profiles',
      required: true,
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
});

const Spool = mongoose.model('Spool', SpoolSchema);

module.exports = Spool;
