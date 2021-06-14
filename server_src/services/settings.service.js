"use strict";

const serverSettingsModel = require("../models/ServerSettings.js");

/**
 * List out all the history records in the database.
 */
module.exports.list = async () => {
  const returnedServerSettings = await serverSettingsModel.find({});
  // Break out of Array
  return returnedServerSettings[0];
};

// /**
//  * Generates the history state value.
//  * @param {Boolean} state boolean value
//  * @throws {Error} If the state is not correctly provided as a Boolean.
//  */
// module.exports.list = async () => {
//   return await serverSettingsModel.find({});
// };
