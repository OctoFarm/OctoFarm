const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const serverConfig = require("../serverConfig/server.js");

// User Modal
const User = require("../models/User.js");

//Login Page
router.get("/login", (req, res) =>
  res.render("login", {
    page: "Login",
    registration: serverConfig.registration
  })
);
if (serverConfig.registration === true) {
  //Register Page
  router.get("/register", (req, res) =>
    res.render("register", {
      page: "Register"
    })
  );

  //Register Handle
  router.post("/register", (req, res) => {
    const { name, username, password, password2 } = req.body;
    let errors = [];

    //Check required fields
    if (!name || !username || !password || !password2) {
      errors.push({ msg: "Please fill in all fields..." });
    }

    //Check passwords match
    if (password !== password2) {
      errors.push({ msg: "Passwords do not match..." });
    }

    //Password at least 6 characters
    if (password.length < 6) {
      errors.push({ msg: "Password should be at least 6 characters..." });
    }

    if (errors.length > 0) {
      res.render("register", {
        page: "Login",
        registration: serverConfig.registration,
        errors,
        name,
        username,
        password,
        password2
      });
    } else {
      //Validation Passed
      User.findOne({ username: username }).then(user => {
        if (user) {
          //User exists
          errors.push({ msg: "Username is already registered" });
          res.render("register", {
            page: "Login",
            registration: serverConfig.registration,
            errors,
            name,
            username,
            password,
            password2
          });
        } else {
          //Check if first user that's created.
          User.find({}).then(user => {
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
            //Hash Password
            bcrypt.genSalt(10, (error, salt) =>
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                //Set password to hashed
                newUser.password = hash;
                //Save new User
                newUser
                  .save()
                  .then(user => {
                    req.flash(
                      "success_msg",
                      "You are now registered and can login"
                    );
                    let page = "login";
                    res.redirect("/users/login");
                  })
                  .catch(err => console.log(err));
              })
            );
          });
        }
      });
    }
  });
}
// Login Handle
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true,
    page: "Login",
    registration: serverConfig.registration
  })(req, res, true);
});

//Logout Handle
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out");
  res.redirect("/users/login");
});

module.exports = router;
