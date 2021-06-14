"use strict";

const mongoose = require("mongoose");

/**
 * Makes sure the mongoose object id is valid for a specific printer
 * @param {Object} id object to check
 * @throws {Error} If id is missing.
 * @throws {Error} If printer object does not have a valid _id.
 */
module.exports.objectIDValidator = async (id) => {
  if (!id) throw new Error("No _id Object");

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Invalid mongoose _id");

  return id;
};

/**
 * Makes sure the mongoose object id is valid for a specific printer
 * @throws {Error} If printer object does not have a valid _id.
 */
module.exports.generateObjectId = async () => {
  const id = mongoose.Types.ObjectId();
  if (!this.objectIDValidator(id))
    throw new Error("Could not validate generated Id");
  return id;
};
