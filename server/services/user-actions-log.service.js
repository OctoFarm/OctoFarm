const UserAction = require("../models/userActionsLog");
const Logger = require("../handlers/logger");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { cloneObject, convertStatusToColour } = require("../utils/mapping.utils");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_USER_ACTIONS);

const last100Actions = [];

const updateUserActionLog = (
  printerID,
  action,
  data,
  currentUser,
  status,
  fullPath = undefined
) => {
  if (!printerID && !action && !currentUser) {
    return;
  }
  const today = new Date();
  const formatAction = {
    printerID,
    action,
    data,
    currentUser,
    date: today,
    fullPath,
    status: convertStatusToColour(status)
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
  const tickerAction = cloneObject(action);

  tickerAction.id = `${tickerAction.printerID}-${new Date(tickerAction.date).getTime()}`;

  tickerAction.printerName = getPrinterStoreCache().getPrinterName(tickerAction.printerID);

  if (last100Actions.length <= 500) {
    last100Actions.push(tickerAction);
  } else {
    last100Actions.shift();
  }

  return tickerAction;
};

const returnLast100Actions = () => {
  if (last100Actions.length === 0) {
    getLast100ActionsFromDatabase().catch((e) => {
      logger.error("Error returning last 100 actions", e.toString());
    });
  }
  return last100Actions;
};

const getLast100ActionsFromDatabase = async () => {
  const last100Database = await UserAction.find({})
    .sort({ _id: -1 })
    .limit(100)
    .then((res) => {
      logger.debug("Successfully grabbed last 100 records from user actions database", res);
      return res;
    })
    .catch((e) => {
      logger.error("Failed to grab last 100 records from user actions database", e);
      return [];
    });
  for (const action of last100Database) {
    last100Actions.push(updateUserActionTicker(cloneObject(action)));
  }
  return last100Database.length;
};

module.exports = {
  updateUserActionLog,
  returnLast100Actions
};
