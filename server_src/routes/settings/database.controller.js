const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../../middleware/auth");
const Logger = require("../../handlers/logger.js");
const { AppConstants } = require("../../app.constants");

const ServerSettingsDB = require("../../models/ServerSettings");
const ClientSettingsDB = require("../../models/ClientSettings");
const HistoryDB = require("../../models/History");
const SpoolsDB = require("../../models/Spool");
const ProfilesDB = require("../../models/Profiles");
const roomDataDB = require("../../models/RoomData");
const UserDB = require("../../models/User");
const PrintersDB = require("../../models/Printer");
const AlertsDB = require("../../models/Alerts");
const GcodeDB = require("../../models/CustomGcode");

class DatabaseController {
  #logger = new Logger("OctoFarm-API");

  constructor({}) {}

  async deleteSchema(req, res) {
    const databaseName = req.params.name;
    await Runner.pause();
    if (databaseName === "nukeEverything") {
      await ServerSettingsDB.deleteMany({});
      await ClientSettingsDB.deleteMany({});
      await HistoryDB.deleteMany({});
      await SpoolsDB.deleteMany({});
      await ProfilesDB.deleteMany({});
      await roomDataDB.deleteMany({});
      await UserDB.deleteMany({});
      await PrintersDB.deleteMany({});
      await AlertsDB.deleteMany({});
      await GcodeDB.deleteMany({});
      res.send({
        message: "Successfully deleted databases, server will restart..."
      });
      this.#logger.info("Database completely wiped.... Restarting server...");
      SystemCommands.rebootOctoFarm();
    } else if (databaseName === "FilamentDB") {
      await SpoolsDB.deleteMany({});
      await ProfilesDB.deleteMany({});
      this.#logger.info("Successfully deleted Filament database.... Restarting server...");
      SystemCommands.rebootOctoFarm();
    } else {
      await eval(databaseName).deleteMany({});
      res.send({
        message: "Successfully deleted " + databaseName + ", server will restart..."
      });
      this.#logger.info(databaseName + " successfully deleted.... Restarting server...");
      SystemCommands.rebootOctoFarm();
    }
  }

  async getSchema(req, res) {
    const databaseName = req.params.name;
    this.#logger.info("Client requests export of " + databaseName);
    let returnedObjects = [];
    if (databaseName === "FilamentDB") {
      returnedObjects.push(await ProfilesDB.find({}));
      returnedObjects.push(await SpoolsDB.find({}));
    } else {
      returnedObjects.push(await eval(databaseName).find({}));
    }
    this.#logger.info("Returning to client database object: " + databaseName);
    res.send({ databases: returnedObjects });
  }
}

// prettier-ignore
module.exports = createController(DatabaseController)
  .prefix(AppConstants.apiRoute + "/settings/database")
  .before([ensureAuthenticated])
  .delete("/:name", "deleteSchema")
  .get("/:name", "getSchema");
