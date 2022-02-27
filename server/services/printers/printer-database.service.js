const printerModel = require("../../models/Printer");
const Logger = require("../../handlers/logger");

const logger = new Logger("OctoFarm-State");

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
        return err;
        logger.error(err);
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
      .then((res) => {
        logger.warning("Successfully deleted printer from database", this.#id);
      })
      .catch((err) => {
        logger.error(err);
      });
  };
}

module.exports = PrinterDatabaseService;
