import Axios from "./axios.service";

export default class OctoFarmClient extends Axios {
  static printerRoute = "/printers";
  static serverSettingsRoute = "/settings/server";
  static logsRoute = `${this.serverSettingsRoute}/logs`;
  static updateSettingsRoute = `${this.serverSettingsRoute}/update`;

  static getPrinter(id) {
    if (!id) {
      throw "Cant fetch printer without defined 'id' input";
    }
    const body = {
      i: id
    };
    return this.post(`${this.printerRoute}/printerInfo/`, body);
  }

  static listPrinters() {
    return this.post(`${this.printerRoute}/printerInfo/`);
  }

  static refreshPrinterSettings(id) {
    const body = {
      i: id
    };
    return this.post(`${this.printerRoute}/updatePrinterSettings`, body);
  }

  static generateLogDump() {
    return this.post(`${this.logsRoute}/generateLogDump`, {});
  }

  static getHistoryStatistics() {
    return this.get("history/statisticsData");
  }

  static getClientSettings() {
    return this.get("settings/client/get");
  }

  static getServerSettings() {
    return this.get(`${this.serverSettingsRoute}/get`);
  }

  static updateServerSettings(settingsObject) {
    //TODO: should be patch not post
    return this.post(this.updateSettingsRoute, settingsObject);
  }

  static restartServer() {
    return this.post(`${this.serverSettingsRoute}/restart`, {});
  }

  static getCustomGcode() {
    return this.get("settings/customGcode");
  }

  static deleteFile(options) {
    return this.post(`${this.printerRoute}/removefile`, options);
  }
}
