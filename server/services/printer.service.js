"use strict";

const printerModel = require("../models/Printer");
const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-Server");

/**
 * Stores a new printer into the database.
 * @param {Object} printer object to create.
 * @throws {Error} If the printer is not correctly provided.
 */
const create = async (printer) => {
  if (!printer) throw new Error("Missing printer");

  return printerModel.create(printer);
};

/**
 * Lists the printers present in the database.
 */
const list = () => {
  return printerModel.find({});
};

const findOneAndUpdate = (id, obj) => {
  return printerModel
    .findOneAndUpdate({ _id: id }, obj, { new: true })
    .then((res) => {
      logger.debug("Successfully updated printer database!", obj);
    })
    .catch((e) => {
      logger.error("Failed to update printer database!", e);
    });
};

const findOneAndPush = (id, pushKey, obj) => {
  return printerModel
    .findOneAndUpdate({ _id: id }, { $push: { [pushKey]: obj } }, { new: true })
    .then((res) => {
      logger.debug("Successfully updated printer database! Key Push: " + pushKey, obj);
    })
    .catch((e) => {
      logger.error("Failed to update printer database!! Key Push: " + pushKey, e);
    });
};

module.exports = {
  create,
  list,
  findOneAndUpdate,
  findOneAndPush
};
