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
    switch (error?.response?.status) {
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
  static printerRoute = "/printers";
  static serverSettingsRoute = "/settings/server";
  static filamentRoute = `/filament`;
  static filamentStatistics = `${this.filamentRoute}/get/statistics`;
  static logsRoute = `${this.serverSettingsRoute}/logs`;
  static updateSettingsRoute = `${this.serverSettingsRoute}/update`;
  static userRoute = `/users/users`;

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

  static async getPrinter(id) {
    if (!id) {
      throw "Cant fetch printer without defined 'id' input";
    }
    const body = {
      i: id
    };
    return await this.post(`${this.printerRoute}/printerInfo/`, body);
  }

  static async listPrinters() {
    return this.post(`${this.printerRoute}/printerInfo/`);
  }

  static async refreshPrinterSettings(id) {
    const body = {
      i: id
    };
    return this.post(`${this.printerRoute}/updatePrinterSettings`, body);
  }

  static async generateLogDump() {
    return this.post(`${this.logsRoute}/generateLogDump`, {});
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

  static async updateServerSettings(settingsObject) {
    //TODO: should be patch not post
    return this.post(this.updateSettingsRoute, settingsObject);
  }

  static async restartServer() {
    return this.post(`${this.serverSettingsRoute}/restart`, {});
  }

  static async getCustomGcode(id) {
    let url = "settings/customGcode";
    if (id) {
      url = url + "/" + id;
    }
    return this.get(url);
  }

  static async getOctoPrintUniqueFolders() {
    return this.get(`${this.printerRoute}/listUniqueFolders`);
  }

  static getCurrentOpState() {
    return this.get("client/currentOpSorting");
  }
  static updateCurrentOpState({ iterie, order }) {
    return this.post("client/currentOpSorting", { iterie, order });
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
