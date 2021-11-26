const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const ClientSettings = require("../models/ClientSettings.js");
const { AppConstants } = require("../app.constants");

const User = require("../models/User.js");
const { UserTokenService } = require("../services/authentication/user-token.service");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean.js");
const { ensureAuthenticated, ensureAdministrator } = require("../config/auth");
const {
  fetchUsers,
  createUser,
  deleteUser,
  resetPassword,
  editUser
} = require("../services/user-service");

// Login Page
router.get("/login", async (req, res) => {
  const serverSettings = SettingsClean.returnSystemSettings();
  res.render("login", {
    page: "Login",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    registration: serverSettings.server.registration,
    serverSettings: serverSettings
  });
});

// Login Handle
router.post(
  "/login",
  passport.authenticate("local", {
    // Dont add or we wont reach remember_me cookie successRedirect: "/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true
  }),
  async function (req, res, next) {
    if (!req.body.remember_me) {
      return next();
    }

    await UserTokenService.issueTokenWithDone(req.user, function (err, token) {
      if (err) {
        return next(err);
      }
      res.cookie("remember_me", token, {
        path: "/",
        httpOnly: true,
        maxAge: 604800000
      });
      return next();
    });
  },
  (req, res) => {
    res.redirect("/dashboard");
  }
);

// Register Page
router.get("/register", async (req, res) => {
  const serverSettings = SettingsClean.returnSystemSettings();
  if (serverSettings.server.registration !== true) {
    return res.redirect("login");
  }

  let currentUsers = await fetchUsers();
  res.render("register", {
    page: "Register",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    serverSettings: serverSettings,
    userCount: currentUsers.length
  });
});

// Register Handle
router.post("/register", async (req, res) => {
  const { name, username, password, password2 } = req.body;
  const errors = [];

  const serverSettings = SettingsClean.returnSystemSettings();
  let currentUsers = await fetchUsers(true);

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

  if (errors.length > 0) {
    res.render("register", {
      page: "Login",
      octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
      registration: serverSettings.server.registration,
      serverSettings: serverSettings,
      errors,
      name,
      username,
      password,
      password2,
      userCount: currentUsers.length
    });
  } else {
    // Validation Passed
    User.findOne({ username }).then((user) => {
      if (user) {
        // User exists
        errors.push({ msg: "Username is already registered" });
        res.render("register", {
          page: "Login",
          octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
          registration: serverSettings.server.registration,
          serverSettings: serverSettings,
          errors,
          name,
          username,
          password,
          password2,
          userCount: currentUsers.length
        });
      } else {
        // Check if first user that's created.
        User.find({}).then(async (user) => {
          let userGroup = "";
          if (user.length < 1) {
            userGroup = "Administrator";
          } else {
            userGroup = "User";
          }
          const userSettings = new ClientSettings();
          await userSettings.save();
          const newUser = new User({
            name,
            username,
            password,
            group: userGroup,
            clientSettings: userSettings._id
          });
          // Hash Password
          bcrypt.genSalt(10, (error, salt) =>
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              // Set password to hashed
              newUser.password = hash;
              // Save new User
              newUser
                .save()
                .then((user) => {
                  req.flash("success_msg", "You are now registered and can login");
                  res.redirect("/users/login");
                })
                .catch((err) => console.log(err))
                .finally(async () => {
                  await SettingsClean.start();
                  await fetchUsers(true);
                });
            })
          );
        });
      }
    });
  }
});

// Logout Handle
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out");
  res.redirect("/users/login");
});

// Get user list
router.get("/users/:id", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const user = await User.findById(req.params.id);
  res.send(user);
});

// Update user
router.patch("/users/:id", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const newUserInformation = req.body;
  const id = req.params.id;
  if ("password" in newUserInformation) {
    res.send(await resetPassword(id, newUserInformation));
  }
  if ("username" in newUserInformation) {
    res.send(await editUser(id, newUserInformation));
  }
});

// New user
router.post("/users", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const user = req.body;
  res.send(await createUser(user));
});

// Delete User
router.delete("/users/:id", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const id = req.params.id;
  res.send(await deleteUser(id));
});

module.exports = router;
