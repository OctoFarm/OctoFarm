const { getDefaultDashboardSettings } = require("../constants/client-settings.constants");
const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const prettyHelpers = require("../../views/partials/functions/pretty.js");
const ServerSentEventsHandler = require("../handlers/sse.handler");

class ViewDashboard {
  #serverVersion;
  #settingsStore;
  #printersStore;
  #octoFarmPageTitle;

  #sseHandler = new ServerSentEventsHandler({});
  #dashboardSseTask;

  constructor({
    settingsStore,
    printersStore,
    dashboardViewSSEHandler,
    dashboardSseTask,
    serverVersion,
    octoFarmPageTitle
  }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#printersStore = printersStore;
    this.#octoFarmPageTitle = octoFarmPageTitle;

    this.#sseHandler = dashboardViewSSEHandler;
    this.#dashboardSseTask = dashboardSseTask;
  }

  async index(req, res) {
    const printers = this.#printersStore.listPrintersFlat();
    const clientSettings = await this.#settingsStore.getClientSettings();

    const dashStatistics = [];
    let dashboardSettings = clientSettings?.dashboard || getDefaultDashboardSettings();

    res.render("dashboard", {
      user: {
        name: req.user.name,
        group: req.user.group
      },
      version: this.#serverVersion,
      printerCount: printers.length,
      page: "Dashboard",
      octoFarmPageTitle: this.#octoFarmPageTitle,
      helpers: prettyHelpers,
      dashboardSettings: dashboardSettings,
      dashboardStatistics: dashStatistics
    });
  }

  async sse(req, res) {
    this.#sseHandler.handleRequest(req, res);
    await this.#dashboardSseTask.run();
  }
}

// prettier-ignore
module.exports = createController(ViewDashboard)
  .prefix("/dashboard")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("", "index")
  .get("/sse", "sse");
