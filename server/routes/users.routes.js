const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const ClientSettings = require("../models/ClientSettings.js");
const { AppConstants } = require("../constants/app.constants");
const { SettingsClean } = require("../services/settings-cleaner.service");
const ServerSettingsDB = require("../models/ServerSettings.js");

const User = require("../models/User.js");
const { UserTokenService } = require("../services/authentication/user-token.service");
const { ensureAuthenticated, ensureAdministrator } = require("../middleware/auth");
const {
  fetchUsers,
  createUser,
  deleteUser,
  resetPassword,
  editUser
} = require("../services/users.service");
const { validateParamsMiddleware } = require("../middleware/validators");
const M_VALID = require("../constants/validate-mongo.constants");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const Logger = require("../handlers/logger");
const logger = new Logger(LOGGER_ROUTE_KEYS.ROUTE_USERS);

// Login Page
router.get("/login", async (_req, res) => {
  const serverSettings = SettingsClean.returnSystemSettings();
  res.render("login", {
    page: "Login",
    layout: "layouts/no-navigation.ejs",
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
    const prevSession = req.session;
    req.session.regenerate((err) => {
      logger.error("Unable to regenerate session!", err);
      Object.assign(req.session, prevSession);
    });

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
  (_req, res) => {
    res.redirect("/dashboard");
  }
);

// Register Page
router.get("/register", async (_req, res) => {
  const serverSettings = SettingsClean.returnSystemSettings();
  if (serverSettings.server.registration !== true) {
    return res.redirect("login");
  }

  let currentUsers = await fetchUsers();
  res.render("register", {
    page: "Register",
    layout: "layouts/no-navigation.ejs",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    serverSettings: serverSettings,
    userCount: currentUsers.length
  });
});

// Register Handle
router.post("/register", async (req, res) => {
  const name = req.bodyString("name");
  const username = req.bodyString("username");
  const password = req.bodyString("password");
  const password2 = req.bodyString("password2");

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
      layout: "layouts/no-navigation.ejs",
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
    User.findOne({ username }).then((currentUser) => {
      if (currentUser) {
        // User exists
        errors.push({ msg: "Username is already registered" });
        res.render("register", {
          layout: "layouts/no-navigation.ejs",
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
        User.find({}).then(async (userList) => {
          let userGroup;
          if (userList.length < 1) {
            userGroup = "Administrator";
          } else {
            userGroup = "User";
          }
          const userSettings = new ClientSettings();
          await userSettings.save();
          await SettingsClean.start();
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
              if (err) {
                logger.error("Unable to generate bycrpt hash!!", err);
                throw err;
              };
              // Set password to hashed
              newUser.password = hash;
              // Save new User
              newUser
                .save()
                .then(async () => {
                  if (userList.length < 1) {
                    const currentSettings = await ServerSettingsDB.find({});
                    currentSettings[0].server.registration = false;
                    currentSettings[0].markModified("server.registration");
                    currentSettings[0].save();
                    await SettingsClean.start();
                  }
                  req.flash("success_msg", "You are now registered and can login");
                  res.redirect("/users/login");
                })
                .catch((theError) => {
                  logger.error("Couldn't save user to database!", theError);
                })
                .finally(async () => {
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
router.get(
  "/users/:id",
  ensureAuthenticated,
  ensureAdministrator,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const user = await User.findById(req.paramString("id"));
    res.send(user);
  }
);

// Update user
router.patch(
  "/users/:id",
  ensureAuthenticated,
  ensureAdministrator,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const newUserInformation = {
      name: req.bodyString("name"),
      username: req.bodyString("username"),
      group: req.bodyString("group"),
      password: req.bodyString("password"),
      password2: req.bodyString("password2")
    };
    const id = req.paramString("id");

    if ("password" in newUserInformation) {
      return res.send(await resetPassword(id, newUserInformation));
    }
    if ("username" in newUserInformation) {
      return res.send(await editUser(id, newUserInformation));
    }
  }
);

// New user
router.post("/users", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const user = req.body;
  res.send(await createUser(user));
});

// Delete User
router.delete(
  "/users/:id",
  ensureAuthenticated,
  ensureAdministrator,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const id = req.paramString("id");
    res.send(await deleteUser(id));
  }
);

module.exports = router;
