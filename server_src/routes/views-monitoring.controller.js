const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const prettyHelpers = require("../../views/partials/functions/pretty.js");

class ViewDashboard {
  #serverVersion;
  #octoFarmPageTitle;

  #settingsStore;
  #printersStore;
  #sortingFilteringCache;
  #sseHandler;

  constructor({
    settingsStore,
    printersStore,
    serverVersion,
    monitoringViewSSEHandler,
    sortingFilteringCache,
    octoFarmPageTitle
  }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#printersStore = printersStore;
    this.#octoFarmPageTitle = octoFarmPageTitle;

    this.#sseHandler = monitoringViewSSEHandler;
    this.#sortingFilteringCache = sortingFilteringCache;
  }

  getCommonMetadata() {
    return {
      printGroups: this.#printersStore.getPrinterGroups(),
      currentChanges: {
        currentSort: this.#sortingFilteringCache.getSorting(),
        currentFilter: this.#sortingFilteringCache.getFilter()
      }
      // dashboardStatistics: PrinterClean.returnDashboardStatistics()
    };
  }

  camera(req, res) {
    this.handler(req, res, "cameraView", "Camera View", this.getCommonMetadata());
  }

  panel(req, res) {
    this.handler(req, res, "panelView", "Panel View", this.getCommonMetadata());
  }

  list(req, res) {
    this.handler(req, res, "listView", "List View", this.getCommonMetadata());
  }

  map(req, res) {
    const meta = {
      printGroups: this.#printersStore.getPrinterGroups(),
      currentChanges: {
        currentSort: this.#sortingFilteringCache.getSorting(),
        currentFilter: this.#sortingFilteringCache.getFilter()
      }
    };
    this.handler(req, res, "mapView", "Map View", meta);
  }

  currentOps(req, res) {
    this.handler(req, res, "currentOperationsView", "Current Operations", {});
  }

  handler(req, res, template, pageTitle, meta = {}) {
    const clientSettings = this.#settingsStore.getClientSettings();
    const printers = this.#printersStore.listPrintersFlat();
    const sortedIndex = this.#printersStore.getPrinterSortingList();

    res.render(template, {
      user: {
        name: req.user.name,
        group: req.user.group
      },
      version: this.#serverVersion,
      octoFarmPageTitle: this.#octoFarmPageTitle,
      page: pageTitle,
      printers,
      printerCount: printers.length,
      helpers: prettyHelpers,
      sortedIndex,
      clientSettings,
      ...meta
    });
  }

  sse(req, res) {
    this.#sseHandler.handleRequest(req, res);
  }
}

// prettier-ignore
module.exports = createController(ViewDashboard)
  .prefix("/mon")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("/camera", "camera")
  .get("/panel", "panel")
  .get("/map", "map")
  .get("/list", "list")
  .get("/current-ops", "currentOps")
  .get("/sse", "sse");
