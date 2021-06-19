const express = require("express");

const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { getServerSettingsCache } = require("../cache/server-settings.cache.js");
const { AppConstants } = require("../app.constants");

// User Modal
const User = require("../models/User.js");

const { Token } = require("../middleware/token.js");

let currentUsers;

async function fetchUsers(force = false) {
  if (!currentUsers || force) {
    currentUsers = await User.find({});
  }
  return currentUsers;
}

// Login Page
router.get("/login", async (req, res) => {
  res.render("login", {
    page: "Login",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    registration: req.serverSettingsCache.server.registration
  });
});

// Login Handle
router.post(
  "/login",
  async (req, res, next) => {
    passport.authenticate(
      "local",
      {
        failureRedirect: "/users/login",
        failureFlash: true,
        page: "Login",
        octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
        registration: req.serverSettingsCache.server.registration
      },
      function (err, user, info) {
        if (info?.message === "Missing credentials") {
          res.status(400);
          res.send(info);
          return next();
        }
        // Issue a remember me cookie if the option was checked
        if (!req.body.remember_me) {
          res.redirect("/dashboard");
          return next();
        }

        Token.issueToken(user, function (err, token) {
          if (err) {
            return next(err);
          }
          res.cookie("remember_me", token, {
            path: "/",
            httpOnly: true,
            maxAge: 604800000
          });
          res.redirect("/dashboard");
          return next();
        });
      }
    )(req, res, next);
  }
  // This redirect is not refined
  // function (req, res) {
  //   res.redirect("/dashboard");
  // }
);

// Register Page
router.get("/register", async (req, res) => {
  if (req.serverSettingsCache.server.registration) {
    return res.redirect("login");
  }

  router.get("/register", (req, res) =>
    res.render("register", {
      page: "Register",
      octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
      registration: req.serverSettingsCache.server.registration,
      userCount: currentUsers.length
    })
  );
});
// Register Handle
router.post("/register", async (req, res) => {
  const { name, username, password, password2 } = req.body;
  const errors = [];
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
      registration: req.serverSettingsCache.server.registration,
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
          registration: req.serverSettingsCache.server.registration,
          errors,
          name,
          username,
          password,
          password2,
          userCount: currentUsers.length
        });
      } else {
        // Check if first user that's created.
        User.find({}).then((user) => {
          let userGroup = "";
          if (user.length < 1) {
            userGroup = "Administrator";
          } else {
            userGroup = "User";
          }
          const newUser = new User({
            name,
            username,
            password,
            group: userGroup
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
                  req.flash(
                    "success_msg",
                    "You are now registered and can login"
                  );
                  const page = "login";
                  res.redirect("/users/login");
                })
                .catch((err) => console.log(err));
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

module.exports = router;
