const mongoose = require("mongoose");

const RollSchema = new mongoose.Schema({
  roll: {
    type: Object,
    required: true
  }
});
const FilamentProfileSchema = new mongoose.Schema({
  manufacturer: {
    type: String,
    required: true
  },
  material: {
    type: String,
    required: true
  },
  density: {
    type: String,
    required: true
  }
});
const FilamentSpoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  }
});
const Roll = mongoose.model("Roll", RollSchema);
const FilamentProfile = mongoose.model(
  "FilamentProfile",
  FilamentProfileSchema
);
const FilamentSpool = mongoose.model("FilamentSpool", FilamentSpoolSchema);

module.exports = Roll;
module.exports = FilamentManu;
module.exports = FilamentType;
