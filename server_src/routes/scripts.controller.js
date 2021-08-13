const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../middleware/auth");
const Logger = require("../handlers/logger.js");
const Alerts = require("../models/Alerts");
const { AppConstants } = require("../app.constants");
const { validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");
const { NotFoundException } = require("../exceptions/runtime.exceptions");

class ScriptsController {
  #serverVersion;
  #octoFarmPageTitle;
  #settingsStore;
  #scriptCheckService;

  logger = new Logger("OctoFarm-API");

  constructor({ settingsStore, serverVersion, scriptCheckService, octoFarmPageTitle }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#octoFarmPageTitle = octoFarmPageTitle;
    this.#scriptCheckService = scriptCheckService;
  }

  async list(req, res) {
    const alerts = await Alerts.find({});
    res.send(alerts);
  }

  async update(req, res) {
    const data = await validateInput(req.params, idRules);
    const alertId = data.id;

    const alertData = req.body;

    let doc = await this.#scriptCheckService.update(alertId, alertData);

    res.send(doc);
  }

  async delete(req, res) {
    const data = await validateInput(req.params, idRules);
    const alertId = data.id;

    await this.#scriptCheckService.delete(alertId);

    res.send({ alerts: "success" });
  }

  async test(req, res) {
    const opts = req.body;
    let testFire = await this.#scriptCheckService.test(opts.scriptLocation, opts.message);
    res.send({ testFire: testFire, status: 200 });
  }

  async save(req, res) {
    const opts = req.body;
    let save = await this.#scriptCheckService.save(
      opts.printer,
      opts.trigger,
      opts.message,
      opts.scriptLocation
    );
    res.send({ message: save, status: 200 });
  }
}

// prettier-ignore
module.exports = createController(ScriptsController)
  .prefix(AppConstants.apiRoute + "/scripts")
  .before([ensureAuthenticated])
  .get("/", "list")
  .put("/:id", "update")
  .delete("/:id", "delete")
  .post("/test", "test")
  .post("/save", "save");
