"use strict";

const printerModel = require("../models/Printer");

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
const list = async () => {
  return printerModel.find({});
};

/**
 * Makes sure printer name exists either as the user defined name or the printer URL.
 * @param {String} printerURL string to check
 * @param {String} name string to check
 * @throws {Error} If at least the printerURL is missing
 */
const definePrinterName = async (printerURL, name) => {
  if (!printerURL) throw new Error("No printer URL");

  if (!name) return printerURL;

  //Can be removed after state clean up...
  if (name === "" || name === null) return printerURL;

  return name;
};

module.exports = {
  create,
  list,
  definePrinterName
};
