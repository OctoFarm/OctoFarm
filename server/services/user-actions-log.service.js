const UserAction = require("../models/userActionsLog");
const Logger = require("../handlers/logger");
const {getPrinterStoreCache} = require("../cache/printer-store.cache");

const logger = new Logger("OctoFarm-UserActions");

const last100Actions = [];

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

  updateUserActionTicker(formatAction);
};

const updateUserActionTicker = (action) => {
  const tickerAction = action;
  tickerAction.id = `${tickerAction.printerID}-${new Date(tickerAction.date).getTime()}`;

  tickerAction.printerName = getPrinterStoreCache().getPrinterName(tickerAction.printerID);

  if (last100Actions.length <= 100) {
    last100Actions.push(tickerAction);
  } else {
    last100Actions.shift();
  }
};

const returnLast100Actions = () => {
  return last100Actions;
};

module.exports = {
  updateUserActionLog,
  returnLast100Actions
};
