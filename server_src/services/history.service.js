"use strict";

const historyModel = require("../models/History");

/**
 * Finds the history rows in the database.
 * @param {any} input
 */
async function find(input) {
  return historyModel.find(input, null, {
    sort: { historyIndex: -1 },
  });
}

module.exports = {
  find,
};
