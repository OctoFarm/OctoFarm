export default class OctoFarmClient {
  static printerRoute = "printers";

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
