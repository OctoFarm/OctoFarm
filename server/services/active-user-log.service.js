const UserAction = require("../models/userActionsLog");
const Logger = require("../handlers/logger");

const logger = new Logger("OctoFarm-UserActions");

const updateUserActionLog = (printerID, action, data, currentUser) => {
  if (!printerID && !action && !currentUser) {
    return;
  }
  const today = new Date();

  const formatAction = {
    printerID,
    action,
    data,
    currentUser,
    date: today
  };

  const newUserAction = new UserAction(formatAction);

  newUserAction
    .save()
    .then((res) => {
      logger.info("Logged new user action", res);
    })
    .catch((e) => {
      logger.error("Failed to log new user action", e.toString());
    });
};

module.exports = {
  updateUserActionLog
};
