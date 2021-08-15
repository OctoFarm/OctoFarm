const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../middleware/auth");
const RoomData = require("../models/RoomData.js");
const { AppConstants } = require("../app.constants");

class RoomDataController {
  #serverVersion;
  #settingsStore;
  #octoFarmPageTitle;

  constructor({ settingsStore, serverVersion, octoFarmPageTitle }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#octoFarmPageTitle = octoFarmPageTitle;
  }

  async create(req, res) {
    const roomData = req.body;
    const databaseData = new RoomData(roomData);
    await databaseData.save();
  }
}

// prettier-ignore
module.exports = createController(RoomDataController)
  .prefix(AppConstants.apiRoute + "/room-data")
  .before([ensureAuthenticated])
  .post("/", "create");
