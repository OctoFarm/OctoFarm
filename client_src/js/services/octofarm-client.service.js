import AxiosService from "./axios.service";
import { APP } from "../constants/api-routes.constants";

export default class OctoFarmClient extends AxiosService {
  static base = "/api";
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
  // APP CALLS
  static updateNotificationCheck() {
    return this.get(APP.UPDATEREADY);
  }
  static getGithubIssueInformation() {
    return this.get(APP.GITHUBISSUE);
  }
  // SYSTEM PAGE CALLS
  static getSystemInformation() {
    return this.get(APP.SYSTEMINFO);
  }
  //DASHBOARD CALLS
  //PRINTER MANAGER CALLS
  //FILE MANAGER CALLS
  //HISTORY CALLS
  //FILAMENT CALLS
  //ALERTS CALLS

  static getPrinter(printerId) {
    if (!printerId) {
      throw "Cant fetch printer without defined 'id' input";
    }
    return this.get(`${this.printerRoute}/${printerId}`);
  }

  static listPrinters() {
    return this.get(`${this.printerRoute}`);
  }

  static createPrinter(newPrinter) {
    this.validateRequiredProps(newPrinter, [
      "apiKey",
      "printerURL"
      // "webSocketURL" // TODO generate client-side
    ]);
    return this.post(`${this.printerRoute}/`, newPrinter);
  }

  static updatePrinterConnectionSettings(settings) {
    this.validateRequiredProps(settings.printer, ["apiKey", "printerURL", "webSocketURL"]);

    return this.patch(`${this.printerRoute}/${settings.printer.id}/connection`, settings);
  }

  static updateSortIndex(idList) {
    return this.patch(`${this.printerRoute}/sort-index`, { sortList: idList });
  }

  static setStepSize(printerId, stepSize) {
    return this.patch(`${this.printerRoute}/${printerId}/step-size`, { stepSize });
  }

  static setFlowRate(printerId, flowRate) {
    return this.patch(`${this.printerRoute}/${printerId}/flow-rate`, { flowRate });
  }

  static setFeedRate(printerId, feedRate) {
    return this.patch(`${this.printerRoute}/${printerId}/feed-rate`, { feedRate });
  }

  static deletePrinter(printerId) {
    return this.delete(`${this.printerRoute}/${printerId}`);
  }

  static resetPowerSettings(printerId) {
    return this.patch(`${this.printerRoute}/${printerId}/reset-power-settings`);
  }

  static reconnectOctoPrintCommand(printerId) {
    return this.put(`${this.printerRoute}/${printerId}/reconnect`);
  }

  static reconnectFarmCommand() {
    throw "This command is not implemented as it is quite taxing...";
    // return this.postApi(`${this.printerRoute}/reconnectOctoPrint/`);
  }

  static refreshPrinterSettings(id) {
    return this.get(`${this.printerRoute}/${id ? id : ""}`);
  }

  static getLogsList() {
    return this.get(this.logsRoute);
  }

  static getPrinterConnectionLogs(printerId) {
    return this.get(`${this.printerRoute}/${printerId}/connection-logs`);
  }

  static getPrinterPluginList(printerId, all = false) {
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

  static getHistory() {
    return this.get(this.historyRoute);
  }

  static deleteHistory(historyId) {
    return this.delete(`${this.historyRoute}/${historyId}`);
  }

  static updateHistory(historyId, data) {
    return this.put(`${this.historyRoute}/${historyId}`, data);
  }

  static getHistoryStatistics() {
    return this.get(this.historyStatsRoute);
  }

  static getServerSettings() {
    return this.get(this.serverSettingsRoute);
  }

  static updateServerSettings(settingsObject) {
    return this.put(this.serverSettingsRoute, settingsObject);
  }

  static getClientSettings() {
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

  static restartServer() {
    return this.patch(this.serverRestartRoute);
  }

  static getCustomGCode() {
    return this.get(this.customGCodeSettingsRoutes);
  }

  static getFilamentDropDownList() {
    return this.get(this.filamentDropdownListRoute);
  }

  static selectFilament(data) {
    return this.patch(this.filamentSelectRoute, data);
  }

  static reSyncFilamentManager() {
    return this.put(this.filamentManagerReSyncRoute);
  }

  static syncFilamentManager(data) {
    return this.patch(this.filamentManagerSyncRoute, data);
  }

  static disableFilamentPlugin(data) {
    return this.put(this.filamentManagerDisableRoute, data);
  }

  static getFilamentSpools() {
    return this.get(this.filamentSpoolsRoute);
  }

  static listFilamentProfiles() {
    return this.get(this.filamentProfilesRoute);
  }

  static updateClientFilter(filterString) {
    return this.patch(`${this.clientFilterRoute}/${filterString}`);
  }

  static updateClientSorting(sortingString) {
    return this.patch(`${this.clientSortingRoute}/${sortingString}`);
  }

  static listAlerts() {
    return this.get(this.alertRoute);
  }

  static createAlert(data) {
    return this.post(`${this.alertRoute}/`, data);
  }

  static updateAlert(scriptId, data) {
    return this.put(`${this.alertRoute}/${scriptId}`, data);
  }

  static deleteAlert(scriptId) {
    return this.delete(`${this.alertRoute}/${scriptId}`);
  }

  static testAlertScript(data) {
    this.validateRequiredProps(data, ["scriptLocation", "message"]);
    return this.post(this.testAlertScriptRoute, data);
  }

  static createRoomData(data) {
    return this.post(this.roomDataRoute, data);
  }
}
