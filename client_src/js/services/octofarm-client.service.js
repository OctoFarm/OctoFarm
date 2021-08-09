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
  static serverSettingsRoute = this.base + "/settings/server";
  static logsRoute = `${this.serverSettingsRoute}/logs`;
  static updateSettingsRoute = `${this.serverSettingsRoute}/update`;

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
    return await this.get(`${this.amIAliveRoute}`);
  }

  static async getPrinter(id) {
    if (!id) {
      throw "Cant fetch printer without defined 'id' input";
    }
    return await this.get(`${this.printerRoute}/${id}`);
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
    return this.post(`${this.printerRoute}/create`, newPrinter);
  }

  static async updatePrinterConnectionSettings(settings) {
    this.validateRequiredProps(settings.printer, ["apiKey", "printerURL", "webSocketURL"]);

    return this.patch(`${this.printerRoute}/update`, settings);
  }

  static async updateSortIndex(idList) {
    return this.patch(`${this.printerRoute}/updateSortIndex`, { sortList: idList });
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

  static async reconnectOctoPrintCommand(id) {
    return this.put(`${this.printerRoute}/${id}/reconnect`);
  }

  static async reconnectFarmCommand() {
    throw "This command is not implemented as it is quite taxing...";
    // return this.postApi(`${this.printerRoute}/reconnectOctoPrint/`);
  }

  static async refreshPrinterSettings(id) {
    return this.get(`${this.printerRoute}/${id ? id : ""}`);
  }

  static async generateLogDump() {
    return this.post(`${this.logsRoute}/generateLogDump`, {});
  }

  static async getHistoryStatistics() {
    return this.get("/history/statisticsData");
  }

  static async getFilamentDropDown() {
    return this.get("/filament/get/dropDownList");
  }

  static async selectFilament(data) {
    return this.post("/filament/select", data);
  }

  static async getHistory() {
    return this.get("/history/get");
  }

  static async getClientSettings() {
    return this.get("/settings/client/get");
  }

  static async getServerSettings() {
    return this.get(`${this.serverSettingsRoute}/get`);
  }

  static async updateServerSettings(settingsObject) {
    //TODO: should be patch not post
    return this.post(this.updateSettingsRoute, settingsObject);
  }

  static async restartServer() {
    return this.post(`${this.serverSettingsRoute}/restart`, {});
  }

  static async getCustomGcode() {
    return this.get("/settings/customGcode");
  }

  static async resyncFilamentManager() {
    return this.post("/filament/filamentManagerReSync");
  }

  static async getFilamentSpools() {
    return this.get("/filament/get/filament");
  }

  static async listFilamentProfiles() {
    return this.get("/filament/get/profile");
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
    return axios.delete(url, data).then((res) => {
      return res.data;
    });
  }
}
