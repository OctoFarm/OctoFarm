import { ApplicationError } from "../exceptions/application-error.handler";
import { ClientErrors } from "../exceptions/octofarm-client.exceptions";
import Axios from "./axios.service";

export default class OctoFarmClient extends Axios {
  static printerRoute = "/printers";
  static serverSettingsRoute = "/settings/server";
  static logsRoute = `${this.serverSettingsRoute}/logs`;
  static updateSettingsRoute = `${this.serverSettingsRoute}/update`;

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

  static async updateServerSettings(settingsObject) {
    //TODO: should be patch not post
    return this.post(this.updateSettingsRoute, settingsObject);
  }

  static async restartServer() {
    return this.post(`${this.serverSettingsRoute}/restart`, {});
  }

  static async getCustomGcode() {
    return this.get("settings/customGcode");
  }
}
