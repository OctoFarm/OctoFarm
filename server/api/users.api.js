const User = require("../models/User.js");
const ClientSettings = require("../models/ClientSettings.js");
const bcrypt = require("bcryptjs");
const { findIndex } = require("lodash");

let currentUsers;

async function fetchUsers(force = false) {
  if (!currentUsers || force) {
    currentUsers = await User.find({});
  }
  return Object.freeze(currentUsers);
}

async function fetchFirstAdministrator() {
  const currentUserList = await fetchUsers();
  return currentUserList[0];
}

async function checkLastAdministrator() {
  const currentUserList = await fetchUsers();
  const userIndex = findIndex(currentUserList, function (o) {
    return o.group === "Administrator";
  });

  return userIndex === -1;
}

async function checkLastExistingUser() {
  const currentUserList = await fetchUsers();
  return currentUserList.length < 2;
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
  let userDeleted = false;
  const errors = [];

  if (await checkLastExistingUser()) {
    errors.push({ msg: "Cannot delete your last user!" });
  }

  if (await checkLastAdministrator()) {
    errors.push({ msg: "Cannot delete your last Administrator!" });
  }

  if (errors.length > 0) {
    return {
      userDeleted,
      errors
    };
  }

  try {
    userDeleted = await User.findByIdAndDelete(id);
    await ClientSettings.findByIdAndDelete(userDeleted.clientSettings);
    await fetchUsers(true);
  } catch (e) {
    console.error(e);
  }

  return {
    userDeleted,
    errors
  };
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

  if (await checkLastAdministrator()) {
    errors.push({ msg: "Cannot set this user's group, this is your last administrator!" });
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
    await fetchUsers(true);
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
  editUser,
  fetchFirstAdministrator
};
