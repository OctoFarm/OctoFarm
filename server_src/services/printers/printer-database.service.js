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

  update = (update) => {
    return printerModel
      .findOneAndUpdate({ _id: this.#id }, update, this.#options)
      .then(() => {
        logger.debug("Successfully saved record! key list: " + Object.keys(update));
      })
      .catch((err) => {
        logger.error(err);
      });
  };

  delete = () => {
    return printerModel.findOneAndDelete({ _id: this.#id });
  };
}

module.exports = PrinterDatabaseService;
