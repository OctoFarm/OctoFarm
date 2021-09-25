const path = require("path");
const Logger = require("../../handlers/logger.js");
const isDocker = require("is-docker");
const envUtils = require("../../utils/env.utils");
const { validateMongoURL } = require("../../handlers/validators");
const { AppConstants } = require("../../app.constants");
const { createController } = require("awilix-express");
const bcrypt = require("bcryptjs");
const SystemSetup = require("../../models/SystemSetup");
const UserDB = require("../../models/User");
const ClientSettingsDB = require("../../models/ClientSettings.js");
const { GROUPS } = require("../../constants/group.constants");
const { SETUP_STAGES } = require("../../constants/system-setup.constants");
const ClientSettingsConstants = require("../../constants/client-settings.constants");

class FallbackInitialSetupController {
  #octoFarmPageTitle;

  #systemSetupStore;
  #systemCommandsService;

  #logger = new Logger("OctoFarm-Server");

  constructor({ octoFarmPageTitle, systemSetupStore, systemCommandsService }) {
    this.#octoFarmPageTitle = octoFarmPageTitle;
    this.#systemSetupStore = systemSetupStore;
    this.#systemCommandsService = systemCommandsService;
  }

  index(req, res) {
    res.render("initial-setup", {
      page: "Initial Setup",
      octoFarmPageTitle: this.#octoFarmPageTitle,
      isPm2: envUtils.isPm2(),
      currentStage: this.#systemSetupStore.getStage(),
      SETUP_STAGES
    });
  }

  async updateSystemState(req, res) {
    switch (req.body.key) {
      case SETUP_STAGES.IS_SYSTEM_CHECKS_OK:
        await this.#systemSetupStore.setSystemChecksDone();
        break;
      case SETUP_STAGES.IS_ADMIN_CREATED:
        await this.#systemSetupStore.setAdminCreated();
        break;
      case SETUP_STAGES.IS_ADDITIONAL_USERS_DONE:
        await this.#systemSetupStore.setAdditionalUsersDone();
        break;
      case SETUP_STAGES.IS_CUSTOMISATION_DONE:
        await this.#systemSetupStore.setCustomisationsDone();
        break;
      default:
        break;
    }
    res.sendStatus(200);
  }

  async getCurrentUserList(req, res) {
    const currentUserList = await UserDB.find({});
    res.send(currentUserList);
  }

  async createAdminUser(req, res) {
    const { name, username, email, password, password2 } = req.body;

    const errors = [];

    // Check required fields
    if (!name || !username || !password || !password2) {
      errors.push({ msg: "Please fill in all fields..." });
    }

    // Check passwords match
    if (password !== password2) {
      errors.push({ msg: "Passwords do not match..." });
    }

    // Password at least 6 characters
    if (password.length < 6) {
      errors.push({ msg: "Password should be at least 6 characters..." });
    }

    if (errors.length > 0) {
      res.render("initial-setup", {
        page: "Initial Setup",
        octoFarmPageTitle: this.#octoFarmPageTitle,
        isPm2: envUtils.isPm2(),
        errors,
        name,
        username,
        email,
        password,
        password2,
        currentStage: this.#systemSetupStore.getStage(),
        SETUP_STAGES
      });
      return;
    }

    const userGroup = GROUPS.ADMIN;

    const newUser = new UserDB({
      name,
      username,
      password,
      email,
      group: userGroup
    });

    // Add client settings to new user...
    const defaultClientSettings = new ClientSettingsDB(
      ClientSettingsConstants.getDefaultSettings()
    );
    await defaultClientSettings.save();

    newUser._clientSettings = defaultClientSettings._id;

    bcrypt.genSalt(10, (error, salt) =>
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        // Set password to hashed
        newUser.password = hash;
        // Save new User
        newUser.save();
        this.#systemSetupStore.setAdminCreated();
        res.render("initial-setup", {
          page: "Initial Setup",
          octoFarmPageTitle: this.#octoFarmPageTitle,
          isPm2: envUtils.isPm2(),
          currentStage: this.#systemSetupStore.getStage(),
          SETUP_STAGES
        });
        // set system state to live
      })
    );
  }

  async restartOctoFarm(req, res) {
    let serviceRestarted = false;
    try {
      serviceRestarted = await this.#systemCommandsService.restartOctoFarm();
    } catch (e) {
      this.#logger.error(e);
    }
    res.send(serviceRestarted);
  }

  async saveConnectionEnv(req, res) {
    if (isDocker()) {
      res.statusCode = 500;
      return res.send({
        reason: `The OctoFarm docker container cannot change this setting. Change the ${AppConstants.MONGO_KEY} variable yourself.`,
        succeeded: false
      });
    }

    const body = req.body;
    const connectionURL = body.connectionURL;
    if (!connectionURL || !validateMongoURL(connectionURL)) {
      res.statusCode = 400;
      return res.send({
        connectionURL,
        reason: "Not a valid connection string",
        succeeded: false
      });
    }

    try {
      envUtils.writeVariableToEnvFile(
        path.join(__dirname, "../../.env"),
        AppConstants.MONGO_KEY,
        connectionURL
      );
    } catch (e) {
      res.statusCode = 500;
      return res.send({
        reason: e.message,
        succeeded: false
      });
    }

    this.#logger.info(`Saved ${AppConstants.MONGO_KEY} env variable to .env file`);

    if (envUtils.isNodemon()) {
      res.send({
        reason: `Succesfully saved ${AppConstants.MONGO_KEY} environment variable to .env file. Please restart OctoFarm manually!`,
        succeeded: true
      });
    } else {
      res.send({
        reason: `Succesfully saved ${AppConstants.MONGO_KEY} environment variable to .env file. Restarting OctoFarm service, please start it again if that fails!`,
        succeeded: true
      });
    }
  }
}

// prettier-ignore
module.exports = createController(FallbackInitialSetupController)
  .prefix("/")
  .get("", "index")
  .put("update-system-state", "updateSystemState")
  .post("restart-octofarm", "restartOctoFarm")
  .post("save-connection-env", "saveConnectionEnv")
  .get("users", "getCurrentUserList")
  .post("users", "createAdminUser")
