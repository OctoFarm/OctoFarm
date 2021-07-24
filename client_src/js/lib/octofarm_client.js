import axios from "axios";

export default class OctoFarmClient {
  static base = "/";
  static printerRoute = "printers";
  static octoFarmErrorMessage = "Unable to contact OctoFarm server, is it online?";

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

  static async getHistoryStatistics() {
    return this.get("history/stats");
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

  static async get(url) {
    return axios
      .get(base + url)
      .then((res) => {
        return res.data;
      })
      .catch((error) => {
        console.error(error);
        UI.createAlert("error", this.octoFarmErrorMessage, 0, "clicked");
      });
  }

  static async post(url, data) {
    return axios
      .post(base + url, data)
      .then((res) => {
        return res.data;
      })
      .catch((error) => {
        console.error(error);
        UI.createAlert("error", this.octoFarmErrorMessage, 0, "clicked");
      });
  }

  static async delete(url) {
    return axios
      .delete(base + url)
      .then((res) => {
        return res.data;
      })
      .catch((error) => {
        console.error(error);
        UI.createAlert("error", this.octoFarmErrorMessage, 0, "clicked");
      });
  }
  static async patch(url, data) {
    return axios
      .delete(base + url, data)
      .then((res) => {
        return res.data;
      })
      .catch((error) => {
        console.error(error);
        UI.createAlert("error", this.octoFarmErrorMessage, 0, "clicked");
      });
  }
}
