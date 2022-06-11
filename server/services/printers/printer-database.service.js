const printerModel = require("../../models/Printer");
const Logger = require("../../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_PRINTER_DATABASE);

class PrinterDatabaseService {
  #id;
  #options = {
    returnOriginal: false
  };
  constructor(id) {
    this.#id = id;
  }

  get = () => {
    return printerModel
      .findById(this.#id)
      .then((res) => {
        logger.debug("Successfully grabbed printer from database");
        return res;
      })
      .catch((err) => {
        logger.error(err);
        return err;
      });
  };

  update = (update) => {
    return printerModel
      .findOneAndUpdate({ _id: this.#id }, update, this.#options)
      .then(() => {
        logger.debug("Successfully saved record! key list", Object.keys(update));
      })
      .catch((err) => {
        logger.error(err);
      });
  };

  delete = () => {
    return printerModel
      .findOneAndDelete({ _id: this.#id })
      .then(() => {
        logger.warning("Successfully deleted printer from database", this.#id);
      })
      .catch((err) => {
        logger.error(err);
      });
  };

  pushAndUpdate = (id, pushKey, obj) => {
    return printerModel
      .findOneAndUpdate({ _id: id }, { $push: { [pushKey]: obj } }, { new: true })
      .then((res) => {
        logger.debug("Successfully updated printer database! Key Push: " + pushKey, obj);
        return res;
      })
      .catch((e) => {
        logger.error("Failed to update printer database!! Key Push: " + pushKey, e);
        return e;
      });
  };
}

module.exports = PrinterDatabaseService;
