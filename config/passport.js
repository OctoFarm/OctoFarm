const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const RememberMeStrategy = require("passport-remember-me").Strategy;

// User model
const User = require("../models/User.js");

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: "username" },
      (username, password, done) => {
        // Match User in db
        User.findOne({ username })
          .then((user) => {
            if (!user) {
              return done(null, false, {
                message: "That username is not registered",
              });
            }

            // Match password
            bcrypt.compare(password, user.password, (err, isMatch) => {
              if (err) throw err;

              if (isMatch) {
                return done(null, user);
              }
              return done(null, false, { message: "Password incorrect" });
            });
          })
          .catch((err) => console.log(err));
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });
};
