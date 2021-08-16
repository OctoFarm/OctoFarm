import axios from "axios";
import { ApplicationError } from "../exceptions/application-error.handler";
import { HTTPError } from "../exceptions/octofarm-api.exceptions";
import { ClientErrors } from "../exceptions/octofarm-client.exceptions";

// axios request interceptor
axios.interceptors.request.use(
  function (config) {
    OctoFarmClient.validatePath(config.url);
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// axios response interceptor
axios.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    switch (error.response.status) {
      case 0:
        throw new ApplicationError(HTTPError.NO_CONNECTION);
      case 400:
        throw new ApplicationError(HTTPError.BAD_REQUEST);
      case 401:
        throw new ApplicationError(HTTPError.UNAUTHORIZED);
      case 403:
        throw new ApplicationError(HTTPError.FORBIDDEN);
      case 404:
        throw new ApplicationError(HTTPError.RESOURCE_NOT_FOUND);
      case 500:
        throw new ApplicationError(HTTPError.INTERNAL_SERVER_ERROR);
      case 502:
        throw new ApplicationError(HTTPError.BAD_GATEWAY);
      case 503:
        throw new ApplicationError(HTTPError.SERVICE_UNAVAILABLE);
      case 504:
        throw new ApplicationError(HTTPError.GATEWAY_TIMEOUT);
      default:
        throw new ApplicationError(HTTPError.UNKNOWN);
    }
  }
);

// TODO: this could end up getting big, consider splitting it.
// Would go by page, each page could get it's own extends class for pre-defined routes building on the CRUD actions available.
export default class OctoFarmClient {
  static base = "/api";
  static amIAliveRoute = this.base + "/amialive";
  static printerRoute = this.base + "/printer";
  static settingsRoute = this.base + "/settings";
  static serverSettingsRoute = this.settingsRoute + "/server";
  static logsRoute = `${this.serverSettingsRoute}/logs`;
  static generateLogsDumpRoute = `${this.logsRoute}/generate-log-dump`;
  static serverRestartRoute = `${this.serverSettingsRoute}/restart`;
  static clientSettingsRoute = this.settingsRoute + "/client";
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

  static validatePath(pathname) {
    if (!pathname) {
      new URL(path, window.location.origin);
      throw new ApplicationError(ClientErrors.FAILED_VALIDATION_PATH);
    }
  }

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
      throw new ApplicationError(ClientErrors.FAILED_VALIDATION_PATH, unsetRequiredProps);
    }
  }

  static async amIAlive() {
    return await this.get(this.amIAliveRoute);
  }

  static async getPrinter(printerId) {
    if (!printerId) {
      throw "Cant fetch printer without defined 'id' input";
    }
    return await this.get(`${this.printerRoute}/${printerId}`);
  }

  static async listPrinters() {
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

  static async generateLogDump() {
    return this.put(this.generateLogsDumpRoute);
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

  static async getClientSettings() {
    return this.get(this.clientSettingsRoute);
  }

  static async getServerSettings() {
    return this.get(this.serverSettingsRoute);
  }

  static async updateServerSettings(settingsObject) {
    //TODO: should be patch not post
    return this.put(this.serverSettingsRoute, settingsObject);
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

  static async get(path) {
    const url = new URL(path, window.location.origin).href;
    return axios.get(url).then((res) => {
      return res.data;
    });
  }

  static async post(path, data) {
    const url = new URL(path, window.location.origin).href;
    return axios.post(url, data).then((res) => {
      return res.data;
    });
  }

  static async put(path, data) {
    const url = new URL(path, window.location.origin).href;
    return axios.put(url, data).then((res) => {
      return res.data;
    });
  }

  static async delete(path) {
    const url = new URL(path, window.location.origin).href;
    return axios.delete(url).then((res) => {
      return res.data;
    });
  }

  static async patch(path, data) {
    const url = new URL(path, window.location.origin).href;
    return axios.patch(url, data).then((res) => {
      return res.data;
    });
  }
}
