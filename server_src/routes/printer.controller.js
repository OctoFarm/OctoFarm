const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const Logger = require("../handlers/logger.js");
const { validateMiddleware, validateInput } = require("../handlers/validators");
const {
  idRules,
  updateSortIndexRules,
  updatePrinterConnectionSettingRules,
  stepSizeRules,
  flowRateRules,
  feedRateRules
} = require("./validation/printer-controller.validation");
const { AppConstants } = require("../app.constants");
const { convertHttpUrlToWebsocket } = require("../utils/url.utils");
const { NotImplementedException } = require("../exceptions/runtime.exceptions");

class PrinterController {
  #printersStore;
  #jobsCache;
  #connectionLogsCache;
  #octoPrintClient;
  #fileCache;

  #logger = new Logger("OctoFarm-API");

  constructor({
    printersStore,
    connectionLogsCache,
    octoPrintApiClientService,
    jobsCache,
    fileCache
  }) {
    this.#printersStore = printersStore;
    this.#jobsCache = jobsCache;
    this.#connectionLogsCache = connectionLogsCache;
    this.#octoPrintClient = octoPrintApiClientService;
    this.#fileCache = fileCache;
  }

  /**
   * Previous printerInfo action (not a list function)
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async get(req, res) {
    const id = req.params.id;
    const foundPrinter = this.#printersStore.getPrinterFlat(id);
    res.send(foundPrinter);
  }

  async create(req, res) {
    const newPrinter = req.body;
    if (!newPrinter.webSocketURL) {
      newPrinter.webSocketURL = convertHttpUrlToWebsocket(newPrinter.printerURL);
    }
    this.#logger.info("Add printer", newPrinter);

    // Has internal validation, but might add some here above as well
    const printerState = await this.#printersStore.addPrinter(req.body);
    res.send({ printerState: printerState.toFlat() });
  }

  async list(req, res) {
    const listedPrinters = this.#printersStore.listPrintersFlat();
    res.send(listedPrinters);
  }

  async delete(req, res) {
    const data = await validateInput(req.params, idRules);
    const printerId = data.id;
    this.#logger.info("Deleting printer with id", printerId);

    const entityRemoved = await this.#printersStore.deletePrinter(printerId);

    res.send({ printerRemoved: entityRemoved });
  }

  /**
   * Update the printer network connection settings like URL or apiKey - nothing else
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async updateConnectionSettings(req, res) {
    const data = await validateMiddleware(req, updatePrinterConnectionSettingRules, res);

    const printerId = data.printer.id;
    const newEntity = await this.#printersStore.updatePrinterConnectionSettings(
      printerId,
      data.printer
    );

    res.send({
      printerURL: newEntity.printerURL,
      camURL: newEntity.camURL,
      apiKey: newEntity.apiKey,
      webSocketURL: newEntity.webSocketURL
    });
  }

  async updateSortIndex(req, res) {
    const data = await validateMiddleware(req, updateSortIndexRules, res);

    this.#logger.info("Sorting printers according to provided order", JSON.stringify(data));

    this.#printersStore.updateSortIndex(data.sortList);
    res.send({});
  }

  async reconnect(req, res) {
    const printerID = req.params.id;
    this.#logger.info("Reconnecting OctoPrint instance: ", printerID);
    this.#printersStore.reconnectOctoPrint(printerID, true);

    res.send({ success: true, message: "Printer will reconnect soon" });
  }

  async setStepSize(req, res) {
    const params = await validateInput(req.params, idRules);
    const data = await validateMiddleware(req, stepSizeRules, res);

    this.#printersStore.setPrinterStepSize(params.id, data.stepSize);
    res.send();
  }

  async setFeedRate(req, res) {
    const params = await validateInput(req.params, idRules);
    const data = await validateMiddleware(req, feedRateRules, res);

    await this.#printersStore.setPrinterFeedRate(params.id, data.feedRate);
    res.send();
  }

  async setFlowRate(req, res) {
    const params = await validateInput(req.params, idRules);
    const data = await validateMiddleware(req, flowRateRules, res);

    await this.#printersStore.setPrinterFlowRate(params.id, data.flowRate);
    res.send();
  }

  async resetPowerSettings(req, res) {
    const params = await validateInput(req.params, idRules);

    const defaultPowerSettings = await this.#printersStore.resetPrinterPowerSettings(params.id);

    res.send({ powerSettings: defaultPowerSettings });
  }

  /**
   * WIP quite slow (100ms+) - compatible to /updatePrinterSettings
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async querySettings(req, res) {
    const params = await validateInput(req.params, idRules);

    const printerState = this.#printersStore.getPrinterState(params.id);
    const printerLogin = printerState.getLoginDetails();

    // TODO We dont process these yet
    const octoPrintConnection = await this.#octoPrintClient.getConnection(printerLogin);
    const octoPrintSettings = await this.#octoPrintClient.getSettings(printerLogin);
    const octoPrintSystemInfo = await this.#octoPrintClient.getSystemInfo(printerLogin);
    // await Runner.getLatestOctoPrintSettingsValues(id);

    res.send({ printerInformation: printerState.toFlat() });
  }

  // TODO === The big todo line ===
  async updateSettings(req, res) {
    const params = await validateInput(req.params, idRules);

    throw new NotImplementedException("Update settings is being split up.");

    // TODO implement as partials (broken right now)
    const settings = req.body;
    this.#logger.info("Update printers request: ", settings);
    const updateSettings = await Runner.updateSettings(settings);
    res.send({ status: updateSettings.status, printer: updateSettings.printer });
  }

  async getConnectionLogs(req, res) {
    const params = await validateInput(req.params, idRules);

    const printerId = params.id;
    this.#logger.info("Grabbing connection logs for: ", printerId);
    let connectionLogs = this.#connectionLogsCache.getPrinterConnectionLogs(printerId);

    res.send(connectionLogs);
  }

  async getPluginList(req, res) {
    const params = await validateInput(req.params, idRules);

    let id = params.id;

    this.#logger.info("Grabbing plugin list for: ", id);
    let pluginList = await Runner.returnPluginList(id);
    res.send(pluginList);

    // The following is not allowed (yet)
    // this.#logger.info("Grabbing global plugin list");
    // let pluginList = await Runner.returnPluginList();
    // res.send(pluginList);
  }
}

// prettier-ignore
module.exports = createController(PrinterController)
  .prefix(AppConstants.apiRoute + "/printer")
  .before([ensureAuthenticated])
  .get("/", "list")
  .post("/", "create")
  .get("/:id", "get")
  .delete("/:id", "delete")
  .patch("/sort-index", "updateSortIndex")
  .put("/:id/reconnect", "reconnect")
  .patch("/:id/connection", "updateConnectionSettings")
  .patch("/:id/step-size", "setStepSize")
  .patch("/:id/flow-rate", "setFlowRate")
  .patch("/:id/feed-rate", "setFeedRate")
  .patch("/:id/reset-power-settings", "resetPowerSettings")
  // WIP line
  .put("/:id/query-settings", "querySettings")
  .patch("/:id/update-settings", "updateSettings")
  .get("/:id/connection-logs/", "getConnectionLogs")
  .get("/:id/plugin-list", "getPluginList");
