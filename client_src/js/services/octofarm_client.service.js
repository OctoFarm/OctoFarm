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

export default class OctoFarmClient {
  static base = "/";
  static params = "?";
  static printerRoute = "printers";

  static validatePath(pathname) {
    if (!pathname) {
      throw new ApplicationError(ClientErrors.FAILED_VALIDATION);
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
    return this.post(`${this.printerRoute}/printfdgdferInfo/`);
  }

  static async refreshPrinterSettings(id) {
    const body = {
      i: id
    };
    return this.post(`${this.printerRoute}/updatePrinterSettings`, body);
  }

  static async getHistoryStatistics() {
    return this.get("history/statisticsData");
  }

  static async getClientSettings() {
    return this.get("settings/client/get");
  }

  static async getServerSettings() {
    return this.get("settings/server/get");
  }

  static async getCustomGcode() {
    return this.get("settings/customGcode");
  }

  static async get(path) {
    const url = new URL(this.base + path, window.location.origin).pathname;
    return axios.get(url).then((res) => {
      return res.data;
    });
  }

  static async post(path, data) {
    const url = new URL(this.base + path, window.location.origin).pathname;
    return axios.post(url, data).then((res) => {
      return res.data;
    });
  }

  static async delete(path) {
    const url = new URL(this.base + path, window.location.origin).pathname;
    return axios.delete(url).then((res) => {
      return res.data;
    });
  }
  static async patch(path, data) {
    const url = new URL(this.base + path, window.location.origin).pathname;
    return axios.delete(url, data).then((res) => {
      return res.data;
    });
  }
}
