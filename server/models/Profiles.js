const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  profile: {
    index: {
      type: Number,
      required: false,
    },
    density: {
      type: Number,
      required: true,
    },
    diameter: {
      type: Number,
      required: true,
    },
    manufacturer: {
      type: String,
      required: true,
    },
    material: {
      type: String,
      required: true,
    },
  },
});
const Profiles = mongoose.model('Profile', ProfileSchema);

module.exports = Profiles;
