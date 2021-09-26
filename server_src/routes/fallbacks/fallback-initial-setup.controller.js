const path = require("path");
const Logger = require("../../handlers/logger.js");
const isDocker = require("is-docker");
const envUtils = require("../../utils/env.utils");
const { AppConstants } = require("../../app.constants");
const { createController } = require("awilix-express");
const bcrypt = require("bcryptjs");
const UserDB = require("../../models/User");
const ClientSettingsDB = require("../../models/ClientSettings.js");
const ClientSettingsConstants = require("../../constants/client-settings.constants");
const { GROUPS } = require("../../constants/group.constants");
const { SETUP_STAGES } = require("../../constants/system-setup.constants");
const { fetchOctoFarmPort, fetchMongoDBConnectionString } = require("../../app-env");

const RESTART_MESSAGE =
  "OctoFarm is now setup... The service will restart in 5 seconds to enable your configuration!";
const SWITCH_TRUE = "on";

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

  async index(req, res) {
    res.render("initial-setup", {
      page: "Initial Setup",
      octoFarmPageTitle: this.#octoFarmPageTitle,
      octoFarmPort: fetchOctoFarmPort(),
      octoFarmDatabase: fetchMongoDBConnectionString(),
      isPm2: envUtils.isPm2(),
      isDocker: isDocker(),
      currentStage: this.#systemSetupStore.getStage(),
      SETUP_STAGES,
      user_list: await UserDB.find({ group: GROUPS.USER })
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
        isDocker: isDocker(),
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
          isDocker: isDocker(),
          isPm2: envUtils.isPm2(),
          currentStage: this.#systemSetupStore.getStage(),
          SETUP_STAGES
        });
        // set system state to live
      })
    );
  }
  async createBasicUser(req, res) {
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
        isDocker: isDocker(),
        errors,
        name,
        username,
        email,
        password,
        password2,
        currentStage: this.#systemSetupStore.getStage(),
        SETUP_STAGES,
        user_list: await UserDB.find({ group: GROUPS.USER })
      });
      return;
    }

    const userGroup = GROUPS.USER;

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
      bcrypt.hash(newUser.password, salt, async (err, hash) => {
        if (err) throw err;
        // Set password to hashed
        newUser.password = hash;
        // Save new User
        await newUser.save();

        res.render("initial-setup", {
          page: "Initial Setup",
          octoFarmPageTitle: this.#octoFarmPageTitle,
          isPm2: envUtils.isPm2(),
          isDocker: isDocker(),
          currentStage: this.#systemSetupStore.getStage(),
          SETUP_STAGES,
          user_list: await UserDB.find({ group: GROUPS.USER })
        });
        // set system state to live
      })
    );
  }

  async updateEnvironment(req, res) {
    const {
      app_title,
      app_port,
      app_db_url,
      release_branch,
      enable_auth,
      enable_registration,
      enable_dashboard,
      enable_file_manager,
      enable_history,
      enable_filament_manager
    } = req.body;

    if (app_title !== "") {
      try {
        envUtils.writeVariableToEnvFile(
          path.join(__dirname, "../../../.env"),
          AppConstants.OCTOFARM_SITE_TITLE_KEY,
          app_title.toString()
        );
        this.#logger.info(
          `Saved ${AppConstants.OCTOFARM_SITE_TITLE_KEY} env variable to .env file`
        );
      } catch (e) {
        this.#logger.error(
          `Unable to save ${AppConstants.OCTOFARM_SITE_TITLE_KEY} env variable to .env file ${e}`
        );
      }
    }
    if (app_port !== "") {
      try {
        envUtils.writeVariableToEnvFile(
          path.join(__dirname, "../../../.env"),
          AppConstants.OCTOFARM_PORT_KEY,
          app_port.toString()
        );
        this.#logger.info(`Saved ${AppConstants.OCTOFARM_PORT_KEY} env variable to .env file`);
      } catch (e) {
        this.#logger.error(
          `Unable to save ${AppConstants.OCTOFARM_PORT_KEY} env variable to .env file ${e}`
        );
      }
    }

    if (app_db_url !== "") {
      try {
        envUtils.writeVariableToEnvFile(
          path.join(__dirname, "../../../.env"),
          AppConstants.MONGO_KEY,
          app_db_url.toString()
        );
        this.#logger.info(`Saved ${AppConstants.MONGO_KEY} env variable to .env file`);
      } catch (e) {
        this.#logger.error(
          `Unable to save ${AppConstants.MONGO_KEY} env variable to .env file ${e}`
        );
      }
    }

    if (release_branch !== "") {
      try {
        envUtils.writeVariableToEnvFile(
          path.join(__dirname, "../../../.env"),
          AppConstants.RELEASE_BRANCH_KEY,
          release_branch.toString()
        );
        this.#logger.info(`Saved ${AppConstants.RELEASE_BRANCH_KEY} env variable to .env file`);
      } catch (e) {
        this.#logger.error(
          `Unable to save ${AppConstants.RELEASE_BRANCH_KEY} env variable to .env file ${e}`
        );
      }
    }

    if (enable_auth !== SWITCH_TRUE) {
      // try {
      //   envUtils.writeVariableToEnvFile(
      //     path.join(__dirname, "../../../.env"),
      //     AppConstants.RELEASE_BRANCH_KEY,
      //     release_branch.toString()
      //   );
      //   this.#logger.info(`Saved ${AppConstants.RELEASE_BRANCH_KEY} env variable to .env file`);
      // } catch (e) {
      //   res.statusCode = 500;
      //   return res.send({
      //     reason: e.message,
      //     succeeded: false
      //   });
      // }
    }

    if (enable_registration !== SWITCH_TRUE) {
      // try {
      //   envUtils.writeVariableToEnvFile(
      //     path.join(__dirname, "../../../.env"),
      //     AppConstants.RELEASE_BRANCH_KEY,
      //     release_branch.toString()
      //   );
      //   this.#logger.info(`Saved ${AppConstants.RELEASE_BRANCH_KEY} env variable to .env file`);
      // } catch (e) {
      //   res.statusCode = 500;
      //   return res.send({
      //     reason: e.message,
      //     succeeded: false
      //   });
      // }
    }

    if (enable_dashboard !== SWITCH_TRUE) {
      try {
        envUtils.writeVariableToEnvFile(
          path.join(__dirname, "../../../.env"),
          AppConstants.ENABLE_DASHBOARD_KEY,
          enable_dashboard.toString()
        );
        this.#logger.info(`Saved ${AppConstants.ENABLE_DASHBOARD_KEY} env variable to .env file`);
      } catch (e) {
        this.#logger.error(
          `Unable to save ${AppConstants.ENABLE_DASHBOARD_KEY} env variable to .env file ${e}`
        );
      }
    }

    if (enable_file_manager !== SWITCH_TRUE) {
      try {
        envUtils.writeVariableToEnvFile(
          path.join(__dirname, "../../../.env"),
          AppConstants.ENABLE_OP_FILE_MANAGER_KEY,
          enable_file_manager.toString()
        );
        this.#logger.info(
          `Saved ${AppConstants.ENABLE_OP_FILE_MANAGER_KEY} env variable to .env file`
        );
      } catch (e) {
        this.#logger.error(
          `Unable to save ${AppConstants.ENABLE_OP_FILE_MANAGER_KEY} env variable to .env file ${e}`
        );
      }
    }

    if (enable_history !== SWITCH_TRUE) {
      try {
        envUtils.writeVariableToEnvFile(
          path.join(__dirname, "../../../.env"),
          AppConstants.ENABLE_HISTORY_KEY,
          enable_history.toString()
        );
        this.#logger.info(`Saved ${AppConstants.ENABLE_HISTORY_KEY} env variable to .env file`);
      } catch (e) {
        this.#logger.error(
          `Unable to save ${AppConstants.ENABLE_HISTORY_KEY} env variable to .env file ${e}`
        );
      }
    }

    if (enable_filament_manager !== SWITCH_TRUE) {
      try {
        envUtils.writeVariableToEnvFile(
          path.join(__dirname, "../../../.env"),
          AppConstants.ENABLE_FILAMENT_MANAGER_KEY,
          enable_filament_manager.toString()
        );
        this.#logger.info(
          `Saved ${AppConstants.ENABLE_FILAMENT_MANAGER_KEY} env variable to .env file`
        );
      } catch (e) {
        this.#logger.error(
          `Unable to save ${AppConstants.ENABLE_FILAMENT_MANAGER_KEY} env variable to .env file ${e}`
        );
      }
    }

    this.#systemSetupStore.setCustomisationsDone();
    await this.#systemCommandsService.restartOctoFarm();

    res.render("initial-setup", {
      page: "Initial Setup",
      octoFarmPageTitle: this.#octoFarmPageTitle,
      octoFarmPort: fetchOctoFarmPort(),
      octoFarmDatabase: fetchMongoDBConnectionString(),
      isPm2: envUtils.isPm2(),
      isDocker: isDocker(),
      currentStage: this.#systemSetupStore.getStage(),
      SETUP_STAGES,
      user_list: await UserDB.find({ group: GROUPS.USER }),
      RESTART_MESSAGE
    });
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
  .post("users/admin", "createAdminUser")
  .post("users/basic", "createBasicUser")
  // Should be PUT to follow previous methods but HTML forms only allow POST/GET
  .post("update-environment", "updateEnvironment")
