import AxiosService from "./axios.service";

export default class OctoFarmClient extends AxiosService {
  static base = "/api";
  static systemInformationRoute = "/system/in3fo";
  static printerRoute = this.base + "/printer";
  static settingsRoute = this.base + "/settings";
  static logsRoute = `${this.settingsRoute}/logs`;
  static generateLogsDumpRoute = `${this.logsRoute}/generate-log-dump`;
  static serverRestartRoute = `${this.settingsRoute}/restart`;
  static clientSettingsRoute = this.settingsRoute + "/client";
  static serverSettingsRoute = this.settingsRoute + "/server";
  static updateOctoFarmRoute = this.serverSettingsRoute + "/update";
  static databaseRoute = this.settingsRoute + "/database";
  static scriptsRoute = this.base + "/alert";
  static customGCodeSettingsRoutes = this.settingsRoute + "/custom-gcode";
  static clientRoute = this.base + "/client";
  static clientFilterRoute = this.clientRoute + "/filter";
  static clientSortingRoute = this.clientRoute + "/sorting";
  static historyRoute = this.base + "/history";
  static historyStatsRoute = this.historyRoute + "/stats";
  static filamentRoute = this.base + "/filament";
  static filamentDropdownListRoute = this.filamentRoute + "/dropDownList";
  static filamentProfilesRoute = this.filamentRoute + "/profiles";
  static filamentSpoolsRoute = this.filamentRoute + "/spools";
  static filamentSelectRoute = this.filamentRoute + "/select";
  static filamentManagerRoute = this.filamentRoute + "/filament-manager";
  static filamentManagerReSyncRoute = this.filamentManagerRoute + "/resync";
  static filamentManagerSyncRoute = this.filamentManagerRoute + "/sync";
  static filamentManagerDisableRoute = this.filamentManagerRoute + "/disable";
  static alertRoute = this.base + "/alert";
  static testAlertScriptRoute = this.alertRoute + "/test-alert-script";
  static roomDataRoute = this.base + "/room-data";

  static validateRequiredProps(input, keys) {
    const unsetRequiredProps = keys.filter((prop) => {
      return !input[prop];
    });
    if (unsetRequiredProps.length) {
      console.error(
        "The following properties were empty/missing in the request",
        unsetRequiredProps
      );
      // TODO unsetRequiredProps are not processed yet
      // throw new ClientError(ClientErrors., unsetRequiredProps);
    }
  }

  static getSystemInformation() {
    return this.get(this.systemInformationRoute);
  }

  static getPrinter(printerId) {
    if (!printerId) {
      throw "Cant fetch printer without defined 'id' input";
    }
    return this.get(`${this.printerRoute}/${printerId}`);
  }

  static listPrinters() {
    return this.get(`${this.printerRoute}`);
  }

  static async createPrinter(newPrinter) {
    this.validateRequiredProps(newPrinter, [
      "apiKey",
      "printerURL"
      // "webSocketURL" // TODO generate client-side
    ]);
    return this.post(`${this.printerRoute}/`, newPrinter);
  }

  static async updatePrinterConnectionSettings(settings) {
    this.validateRequiredProps(settings.printer, ["apiKey", "printerURL", "webSocketURL"]);

    return this.patch(`${this.printerRoute}/${settings.printer.id}/connection`, settings);
  }

  static async updateSortIndex(idList) {
    return this.patch(`${this.printerRoute}/sort-index`, { sortList: idList });
  }

  static async setStepSize(printerId, stepSize) {
    return this.patch(`${this.printerRoute}/${printerId}/step-size`, { stepSize });
  }

  static async setFlowRate(printerId, flowRate) {
    return this.patch(`${this.printerRoute}/${printerId}/flow-rate`, { flowRate });
  }

  static async setFeedRate(printerId, feedRate) {
    return this.patch(`${this.printerRoute}/${printerId}/feed-rate`, { feedRate });
  }

  static async deletePrinter(printerId) {
    return this.delete(`${this.printerRoute}/${printerId}`);
  }

  static async resetPowerSettings(printerId) {
    return this.patch(`${this.printerRoute}/${printerId}/reset-power-settings`);
  }

  static async reconnectOctoPrintCommand(printerId) {
    return this.put(`${this.printerRoute}/${printerId}/reconnect`);
  }

  static async reconnectFarmCommand() {
    throw "This command is not implemented as it is quite taxing...";
    // return this.postApi(`${this.printerRoute}/reconnectOctoPrint/`);
  }

  static async refreshPrinterSettings(id) {
    return this.get(`${this.printerRoute}/${id ? id : ""}`);
  }

  static getLogsList() {
    return this.get(this.logsRoute);
  }

  static async getPrinterConnectionLogs(printerId) {
    return this.get(`${this.printerRoute}/${printerId}/connection-logs`);
  }

  static async getPrinterPluginList(printerId, all = false) {
    if (!all) {
      return this.get(`${this.printerRoute}/${printerId}/plugins-list`);
    } else {
      throw "All Plugins query - Not Implemented Yet";
    }
  }

  static getScriptsList() {
    return this.get(this.scriptsRoute);
  }

  static generateLogDump() {
    return this.put(this.generateLogsDumpRoute);
  }

  static downloadLogFile(file) {
    window.open(`${OctoFarmClient.logsRoute}/${file}`);
  }

  static async getHistory() {
    return this.get(this.historyRoute);
  }

  static async deleteHistory(historyId) {
    return this.delete(`${this.historyRoute}/${historyId}`);
  }

  static async updateHistory(historyId, data) {
    return this.put(`${this.historyRoute}/${historyId}`, data);
  }

  static async getHistoryStatistics() {
    return this.get(this.historyStatsRoute);
  }

  static async getServerSettings() {
    return this.get(this.serverSettingsRoute);
  }

  static updateServerSettings(settingsObject) {
    return this.put(this.serverSettingsRoute, settingsObject);
  }

  static async getClientSettings() {
    return this.get(this.clientSettingsRoute);
  }

  static updateClientSettings(settingsObject) {
    return this.put(this.clientSettingsRoute, settingsObject);
  }

  static checkForOctoFarmUpdates() {
    return this.get(this.updateOctoFarmRoute);
  }

  static actionOctoFarmUpdates(data) {
    return this.post(this.updateOctoFarmRoute, data);
  }

  static getDatabaseList(databaseName) {
    return this.get(this.databaseRoute + `/${databaseName}`);
  }

  static async restartServer() {
    return this.patch(this.serverRestartRoute);
  }

  static async getCustomGCode() {
    return this.get(this.customGCodeSettingsRoutes);
  }

  static async getFilamentDropDownList() {
    return this.get(this.filamentDropdownListRoute);
  }

  static async selectFilament(data) {
    return this.patch(this.filamentSelectRoute, data);
  }

  static async reSyncFilamentManager() {
    return this.put(this.filamentManagerReSyncRoute);
  }

  static async syncFilamentManager(data) {
    return this.patch(this.filamentManagerSyncRoute, data);
  }

  static async disableFilamentPlugin(data) {
    return this.put(this.filamentManagerDisableRoute, data);
  }

  static async getFilamentSpools() {
    return this.get(this.filamentSpoolsRoute);
  }

  static async listFilamentProfiles() {
    return this.get(this.filamentProfilesRoute);
  }

  static async updateClientFilter(filterString) {
    return this.patch(`${this.clientFilterRoute}/${filterString}`);
  }

  static async updateClientSorting(sortingString) {
    return this.patch(`${this.clientSortingRoute}/${sortingString}`);
  }

  static async listAlerts() {
    return await this.get(this.alertRoute);
  }

  static async createAlert(data) {
    return await this.post(`${this.alertRoute}/`, data);
  }

  static async updateAlert(scriptId, data) {
    return await this.put(`${this.alertRoute}/${scriptId}`, data);
  }

  static async deleteAlert(scriptId) {
    return await this.delete(`${this.alertRoute}/${scriptId}`);
  }

  static async testAlertScript(data) {
    this.validateRequiredProps(data, ["scriptLocation", "message"]);
    return await this.post(this.testAlertScriptRoute, data);
  }

  static async createRoomData(data) {
    return await this.post(this.roomDataRoute, data);
  }
}
