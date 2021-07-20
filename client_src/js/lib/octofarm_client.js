export default class OctoFarmClient {
  static apiRoute = "api";
  static printerRoute = this.apiRoute + "/printer";

  static async getPrinter(id) {
    if (!id) {
      throw "Cant fetch printer without defined 'id' input";
    }
    return await this.get(`${this.printerRoute}/${id}`);
  }

  static async listPrinters() {
    return this.get(`${this.printerRoute}`);
  }

  static async refreshPrinterSettings(id) {
    return this.get(`${this.printerRoute}/${id ? id : ""}`);
  }

  static async getHistoryStatistics() {
    return this.get("history/stats").then((r) => r.json());
  }

  static async get(item) {
    const url = `/${item}`;
    const get = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (get.status === 400) {
      throw new Error(`Malformed request! Status: ${get.status} - ${get.statusText}`);
    } else if (get.status === 503) {
      throw new Error("Error contacting server, is it alive?");
    } else if (get.status === 204) {
      return;
    }
    return await get.json();
  }

  static async post(item, data) {
    const url = `/${item}`;
    const post = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    if (post.status === 400) {
      throw new Error(`Malformed request! Status: ${post.status} - ${post.statusText}`);
    } else if (post.status === 503) {
      throw new Error("Error contacting server, is it alive?");
    } else if (post.status === 204) {
      return;
    }

    return await post.json();
  }

  static async delete(item) {
    const url = `/${item}`;
    return fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
