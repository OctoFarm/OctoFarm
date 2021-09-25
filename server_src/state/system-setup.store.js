const { SERVER_ISSUES } = require("../constants/server-message.constants");
const { SETUP_STAGES } = require("../constants/system-setup.constants");

class SystemSetupStore {
  #systemSetup;

  #systemSetupService;

  constructor({ systemSetupService }) {
    this.#systemSetupService = systemSetupService;
  }

  async reloadSystemSetupState() {
    this.#systemSetup = await this.#systemSetupService.getOrCreate();
  }

  async loadSystemSetupState() {
    this.#systemSetup = await this.#systemSetupService.getOrCreate();
    if (!this.#systemSetup.isSetup) {
      throw SERVER_ISSUES.SYSTEM_NOT_SETUP;
    }
  }

  getStage() {
    const systemSetup = this.getSystemSetupState();
    for (const key in systemSetup) {
      if (!systemSetup[key] && key !== "_id" && key !== SETUP_STAGES.IS_SETUP) {
        return key;
      }
    }
    return null;
  }

  getSystemSetupState() {
    return Object.freeze({
      ...this.#systemSetup._doc
    });
  }

  setSystemChecksDone() {
    this.#systemSetupService.updateDatabase(SETUP_STAGES.IS_SYSTEM_CHECKS_OK, true);
    return this.reloadSystemSetupState();
  }

  setAdminCreated() {
    this.#systemSetupService.updateDatabase(SETUP_STAGES.IS_ADMIN_CREATED, true);
    return this.reloadSystemSetupState();
  }

  setAdditionalUsersDone() {
    this.#systemSetupService.updateDatabase(SETUP_STAGES.IS_ADDITIONAL_USERS_DONE, true);
    return this.reloadSystemSetupState();
  }
  setCustomisationsDone() {
    this.#systemSetupService.updateDatabase(SETUP_STAGES.IS_CUSTOMISATION_DONE, true);
    this.setSetupCompleted().then();
    return this.reloadSystemSetupState();
  }
  setSetupCompleted() {
    this.#systemSetupService.updateDatabase(SETUP_STAGES.IS_SETUP, true);
    return this.reloadSystemSetupState();
  }
}

module.exports = SystemSetupStore;
