const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  profile: {
    type: Object,
    required: true
  },
});
const Profile = mongoose.model("Profile", ProfileSchema);

module.exports = Profile;