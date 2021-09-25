const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: false,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  group: {
    type: String,
    required: false
  },
  _clientSettings: {
    type: Schema.Types.ObjectId,
    ref: "",
    required: true
  }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
