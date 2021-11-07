const User = require("../models/User.js");
const ClientSettings = require("../models/ClientSettings.js");
const bcrypt = require("bcryptjs");

let currentUsers;

async function fetchUsers(force = false) {
  if (!currentUsers || force) {
    currentUsers = await User.find({});
  }
  return Object.freeze(currentUsers);
}

async function createUser({
  name = undefined,
  username = undefined,
  group = undefined,
  password = undefined,
  password2 = undefined
}) {
  const errors = [];
  let createdNewUser = false;
  // Check required fields
  if (!name || !username || !password || !password2) {
    errors.push({ msg: "Please fill in all fields..." });
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match..." });
  }

  // Password at least 6 characters
  if (password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters..." });
  }

  // Group must be Administrator or User
  if (!["Administrator", "User"].includes(group)) {
    errors.push({ msg: "Group is not recognised!" });
  }

  if (errors.length > 0) {
    return {
      createdNewUser,
      errors
    };
  }

  const userSettings = new ClientSettings();

  try {
    const newUser = new User({
      name,
      username,
      password,
      group,
      clientSettings: userSettings._id
    });
    newUser.password = await new Promise((resolve, reject) => {
      bcrypt.hash(newUser.password, 10, function (err, hash) {
        if (err) reject(err);
        resolve(hash);
      });
    });
    await newUser.save();
    createdNewUser = newUser;
  } catch (e) {
    createdNewUser = false;
    errors.push({ msg: "Failed to save new user: " + e });
    ClientSettings.findByIdAndRemove(userSettings._id);
  }
  if (errors.length === 0) {
    try {
      await userSettings.save();
    } catch (e) {
      errors.push({ msg: "Failed to save new user settings: " + e });
    }
  }
  await fetchUsers(true);
  return {
    createdNewUser,
    errors
  };
}

async function deleteUser(id) {
  let userDeleted;
  try {
    userDeleted = await User.findByIdAndDelete(id);
    await ClientSettings.findByIdAndDelete(userDeleted.clientSettings);
    await fetchUsers(true);
  } catch (e) {
    console.error(e);
  }

  return userDeleted;
}

async function resetPassword(id, { password = undefined, password2 = undefined }) {
  const errors = [];
  if (!id) {
    errors.push({ msg: "No id provided!" });
  }

  if (!password || !password2) {
    errors.push({ msg: "Please fill in all fields..." });
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match..." });
  }

  // Password at least 6 characters
  if (password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters..." });
  }

  let user = false;

  if (errors.length > 0) {
    return {
      user,
      errors
    };
  }
  try {
    user = await User.findById(id);
    user.password = await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, function (err, hash) {
        if (err) reject(err);
        resolve(hash);
      });
    });
    await user.save();
  } catch (e) {
    errors.push({ msg: "Error saving user information: " + e });
  }

  return {
    user,
    errors
  };
}

async function editUser(id, { name = undefined, username = undefined, group = undefined }) {
  const errors = [];
  let createdNewUser = false;
  // Check required fields
  if (!name || !username || !group) {
    errors.push({ msg: "Please fill in all fields..." });
  }

  // Group must be Administrator or User
  if (!["Administrator", "User"].includes(group)) {
    errors.push({ msg: "Group is not recognised!" });
  }

  if (errors.length > 0) {
    return {
      createdNewUser,
      errors
    };
  }
  let user;
  try {
    user = await User.findById(id);
    user.name = name;
    user.username = username;
    user.group = group;
    await user.save();
  } catch (e) {
    errors.push({ msg: "Error saving user information: " + e });
  }

  return {
    user,
    errors
  };
}

module.exports = {
  fetchUsers,
  createUser,
  deleteUser,
  resetPassword,
  editUser
};
