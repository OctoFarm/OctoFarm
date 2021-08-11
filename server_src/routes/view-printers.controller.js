const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const prettyHelpers = require("../../views/partials/functions/pretty.js");

class ViewPrinters {
  #serverVersion;
  #printersStore;
  #octoFarmPageTitle;
  #octofarmUpdateService;

  #sseTask;
  #sseHandler;

  constructor({
    serverVersion,
    octoFarmPageTitle,
    printersStore,
    printerViewSSEHandler,
    printerSseTask,
    octofarmUpdateService
  }) {
    this.#serverVersion = serverVersion;
    this.#printersStore = printersStore;
    this.#octoFarmPageTitle = octoFarmPageTitle;
    this.#octofarmUpdateService = octofarmUpdateService;
    this.#sseTask = printerSseTask;
    this.#sseHandler = printerViewSSEHandler;
  }

  async index(req, res) {
    const printers = await this.#printersStore.listPrintersFlat();

    res.render("printerManagement", {
      name: req.user.name,
      userGroup: req.user.group,
      version: this.#serverVersion,
      page: "Printer Manager",
      octoFarmPageTitle: this.#octoFarmPageTitle,
      printerCount: printers.length,
      helpers: prettyHelpers,
      air_gapped: this.#octofarmUpdateService.getAirGapped()
    });
  }

  async sse(req, res) {
    this.#sseHandler.handleRequest(req, res);
    await this.#sseTask.run();
  }
}

// prettier-ignore
module.exports = createController(ViewPrinters)
  .prefix("/printers")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("", "index")
  .get("/sse", "sse");
