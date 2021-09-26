const SystemSetupDB = require("../models/SystemSetup.js");
const { SERVER_ISSUES } = require("../constants/server-message.constants");

class SystemSetupService {
  #databaseID;

  constructor({}) {}

  async probeDatabase() {
    await SystemSetupDB.find({}).catch((e) => {
      if (e.message.includes("command find requires authentication")) {
        throw "Database authentication failed.";
      } else {
        throw "Database connection failed.";
      }
      throw "Got you there bitch!";
    });
  }

  async getOrCreate() {
    const systemSetup = await SystemSetupDB.find({});
    if (systemSetup.length < 1) {
      // Initialise system setup defaults and trigger setup page
      const newSystemSetup = new SystemSetupDB();
      this.#databaseID = newSystemSetup._id;
      await newSystemSetup.save();
      return newSystemSetup;
    } else {
      this.#databaseID = systemSetup[0]._id;
      systemSetup[0].save();
      return systemSetup[0];
    }
  }

  updateDatabase(key = undefined, value = undefined) {
    if (!key || !value) throw "No value supplied";
    const updateObject = {
      [key]: value
    };

    return SystemSetupDB.findByIdAndUpdate(this.#databaseID, updateObject).catch((e) => {
      console.error("E", e);
    });
  }
}

module.exports = SystemSetupService;
