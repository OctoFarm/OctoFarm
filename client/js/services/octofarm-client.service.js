import axios from "axios";
import { ApplicationError } from "../exceptions/application-error.handler";
import { HTTPError } from "../exceptions/octofarm-api.exceptions";
import { ClientErrors } from "../exceptions/octofarm-client.exceptions";

//REFACTOR move out to utility file
const prettyPrintStatusError = (errorString) => {
  const { name, errors } = errorString;

  let prettyString = `<br>###${name}###<br>`;

  for (const key in errors) {
    prettyString += `<br>#${key.toLocaleUpperCase()}#<br> ${
      errors[key].message
    } <br>`;
  }

  return prettyString;
};

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
    //Guard clause - Server offline then these commands will always error...
    if (window.serverOffline) {
      return { data: false };
    }

    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    switch (error?.response?.status) {
      case 0:
        throw new ApplicationError(HTTPError.NO_CONNECTION);
      case 400:
        throw new ApplicationError(HTTPError.BAD_REQUEST, {
          message: `${HTTPError.BAD_REQUEST.message}: ${prettyPrintStatusError(
            error.response.data
          )}`,
        });
      case 401:
        throw new ApplicationError(HTTPError.UNAUTHORIZED);
      case 403:
        throw new ApplicationError(HTTPError.FORBIDDEN);
      case 404:
        throw new ApplicationError(HTTPError.RESOURCE_NOT_FOUND);
      case 500:
        throw new ApplicationError(HTTPError.INTERNAL_SERVER_ERROR, {
          message: `${HTTPError.INTERNAL_SERVER_ERROR.message}: ${error.response.statusText}`,
        });
      case 502:
        throw new ApplicationError(HTTPError.BAD_GATEWAY);
      case 503:
        throw new ApplicationError(HTTPError.SERVICE_UNAVAILABLE, {
          message: `${HTTPError.SERVICE_UNAVAILABLE.message}: ${error.response.statusText}`,
        });
      case 504:
        throw new ApplicationError(HTTPError.GATEWAY_TIMEOUT);
      default:
        throw new ApplicationError(HTTPError.UNKNOWN, {
          message: `${HTTPError.UNKNOWN.message}: ${error?.response?.statusText}`,
        });
    }
  }
);

// REFACTOR: this could end up getting big, consider splitting it.
// Would go by page, each page could get it's own extends class for pre-defined routes building on the CRUD actions available.
export default class OctoFarmClient {
  static base = "/api";
  static printerRoute = "/printers";
  static disablePrinterRoute = this.printerRoute + "/disable";
  static enablePrinterRoute = this.printerRoute + "/enable";
  static generatePrinterNameRoute =
    this.printerRoute + "/generate_printer_name";
  static updateUserActionsLogRoute = this.printerRoute + "/logUserPrintAction";
  static updateActiveUserRoute = this.printerRoute + "/updateActiveUser";
  static printerStepChangeRoute = this.printerRoute + "/stepChange";
  static forceReconnectRoute = this.printerRoute + "/forceReconnect";
  static serverSettingsRoute = "/settings/server";
  static clientSettingsRoute = "/settings/client";
  static filamentRoute = `/filament`;
  static filamentStatistics = `${this.filamentRoute}/get/statistics`;
  static filamentProfiles = `${this.filamentRoute}/get/profile`;
  static filamentSpools = `${this.filamentRoute}/get/filament`;
  static logsRoute = `${this.serverSettingsRoute}/logs`;
  static updateSettingsRoute = `${this.serverSettingsRoute}/update`;
  static fireLogToServerRoute = `${this.clientSettingsRoute}/logs`;
  static userRoute = `/users/users`;
  static healthCheckRoute = `${this.printerRoute}/healthChecks`;
  static farmOverviewRoute = `${this.printerRoute}/farmOverview`;
  static connectionOverviewRoute = `${this.printerRoute}/connectionOverview`;
  static selectedFilamentRoute = `${this.printerRoute}/selectedFilament`;

  static validatePath(pathname) {
    if (!pathname) {
      const newURL = new URL(path, window.location.origin);
      throw new ApplicationError(ClientErrors.FAILED_VALIDATION_PATH, {
        message: `${ClientErrors.FAILED_VALIDATION_PATH} ${newURL}`,
      });
    }
  }

  static async getPrinter(id) {
    if (!id) {
      throw new Error("Cant fetch printer without defined 'id' input");
    }
    const body = {
      i: id,
    };
    return this.post(`${this.printerRoute}/printerInfo/`, body);
  }

  static async getPrinterName() {
    return this.get(this.generatePrinterNameRoute);
  }

  static async forceReconnect(id) {
    const data = {
      id,
    };
    return this.post(this.forceReconnectRoute, data);
  }

  static async listPrinters(disabled = false, showFullList = false) {
    let path = `${this.printerRoute}/printerInfo`;

    if (disabled) {
      path += "?disabled=true";
    }

    if (showFullList) {
      path += "?fullList=true";
    }

    return this.post(path);
  }

  static async disablePrinter(idList) {
    const body = {
      idList,
    };
    return this.post(`${this.disablePrinterRoute}`, body);
  }

  static async enablePrinter(idList) {
    const body = {
      idList,
    };
    return this.post(`${this.enablePrinterRoute}`, body);
  }

  static async refreshPrinterSettings(id) {
    const body = {
      i: id,
    };
    return this.post(`${this.printerRoute}/updatePrinterSettings`, body);
  }

  static async generateLogDump() {
    return this.post(`${this.logsRoute}/generateLogDump`, {});
  }

  static async deleteLogFile(filename) {
    return this.delete(`${this.logsRoute}/${filename}`);
  }

  static async clearOldLogs() {
    return this.delete(`${this.logsRoute}/clear-old`);
  }

  static async getHistoryStatistics() {
    return this.get("history/statisticsData");
  }

  static async getClientSettings() {
    return this.get("settings/client/get");
  }

  static async getServerSettings() {
    return this.get(`${this.serverSettingsRoute}/get`);
  }

  static async getSelectedFilament(id) {
    return this.get(`${this.selectedFilamentRoute}/${id}`);
  }

  static async setPrinterSteps(id, newSteps) {
    return this.post("printers/stepChange", {
      printer: id,
      newSteps,
    });
  }

  static async getUser(id) {
    return this.get(`${this.userRoute}/${id}`);
  }

  static async createNewUser(user) {
    return this.post(`${this.userRoute}`, user);
  }

  static async editUser(id, user) {
    return this.patch(`${this.userRoute}/${id}`, user);
  }

  static async deleteUser(id) {
    return this.delete(`${this.userRoute}/${id}`);
  }

  static async resetUserPassword(id, password) {
    return this.patch(`${this.userRoute}/${id}`, password);
  }

  static async getFilamentStatistics() {
    return this.get(this.filamentStatistics);
  }

  static async getFilamentSpools() {
    return this.get(this.filamentSpools);
  }

  static async getFilamentProfiles() {
    return this.get(this.filamentProfiles);
  }

  static async updateServerSettings(settingsObject) {
    //REFACTOR: should be patch not post
    return this.post(this.updateSettingsRoute, settingsObject);
  }

  static async restartServer() {
    return this.post(`${this.serverSettingsRoute}/restart`, {});
  }

  static async getCustomGcode(id) {
    let url = "settings/customGcode";
    if (id) {
      url = `${url}/${id}`;
    }
    return this.get(url);
  }

  static async getOctoPrintUniqueFolders() {
    return this.get(`${this.printerRoute}/listUniqueFolders`);
  }

  static getCurrentOpState() {
    return this.get("client/currentOpSorting");
  }

  static getHealthChecks() {
    return this.get(this.healthCheckRoute);
  }

  static getFarmOverview() {
    return this.get(this.farmOverviewRoute);
  }

  static getConnectionOverview() {
    return this.get(this.connectionOverviewRoute);
  }
  static async sendError(error) {
    try {
      await this.post(this.fireLogToServerRoute, error);
    } catch (e) {
      console.error(e.toString());
    }
  }

  static updateCurrentOpState({ iterie, order }) {
    return this.post("client/currentOpSorting", { iterie, order });
  }

  static async updateActiveControlUser(id) {
    try {
      await this.patch(`${this.updateActiveUserRoute}/${id}`);
    } catch (e) {
      console.error("Unable to update active control user!", e.toString());
    }
  }

  static async updateUserActionsLog(id, body) {
    try {
      await this.post(`${this.updateUserActionsLogRoute}/${id}`, body);
    } catch (e) {
      console.error("Unable to update user actions log!", e.toString());
    }
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
