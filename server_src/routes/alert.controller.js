const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../middleware/auth");
const { AppConstants } = require("../app.constants");
const { validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");
const {
  testAlertScriptRules,
  createAlertRules,
  updateAlertRules
} = require("./validation/alert-controller.validation");
const Logger = require("../handlers/logger.js");

class AlertController {
  #serverVersion;
  #octoFarmPageTitle;
  #settingsStore;
  #alertService;
  #scriptService;

  logger = new Logger("OctoFarm-API");

  constructor({ settingsStore, serverVersion, alertService, scriptService, octoFarmPageTitle }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#octoFarmPageTitle = octoFarmPageTitle;
    this.#alertService = alertService;
    this.#scriptService = scriptService;
  }

  async list(req, res) {
    const alerts = await this.#alertService.list();
    res.send(alerts);
  }

  async create(req, res) {
    const data = await validateInput(req.body, createAlertRules);

    let createdAlert = await this.#alertService.create(data);
    res.send(createdAlert);
  }

  async update(req, res) {
    const params = await validateInput(req.params, idRules);
    const alertId = params.id;
    const updateData = await validateInput(req.body, updateAlertRules);

    let doc = await this.#alertService.update(alertId, updateData);

    res.send(doc);
  }

  async delete(req, res) {
    const data = await validateInput(req.params, idRules);
    const alertId = data.id;

    await this.#alertService.delete(alertId);

    res.send();
  }

  async testAlertScript(req, res) {
    const data = await validateInput(req.body, testAlertScriptRules);

    let testExecution = await this.#scriptService.execute(data.scriptLocation, data.message);
    res.send(testExecution);
  }
}

// prettier-ignore
module.exports = createController(AlertController)
  .prefix(AppConstants.apiRoute + "/alert")
  .before([ensureAuthenticated])
  .get("/", "list")
  .post("/", "create")
  .put("/:id", "update")
  .delete("/:id", "delete")
  .patch("/test-alert-script", "testAlertScript");
