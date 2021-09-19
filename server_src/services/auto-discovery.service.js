const fetch = require("node-fetch");
const { parseString } = require("xml2js");
const Logger = require("../handlers/logger.js");
const {
  jsonContentType,
  contentTypeHeaderKey
} = require("./octoprint/constants/octoprint-service.constants");

class AutoDiscoveryService {
  #discoveredDevices = [];

  #ssdpClient;
  #httpClient;
  #logger = new Logger("OctoFarm-Server");

  constructor({ httpClient }) {
    this.#httpClient = httpClient;
  }

  #setupSsdp() {
    this.#ssdpClient = require("node-upnp-ssdp");
    this.#bindSsdp();
  }

  #bindSsdp() {
    this.#ssdpClient.on("DeviceFound", (res) => {
      this.#logger.info("Device found! Parsing information", res.location);
      if (res.location) {
        this.#httpClient
          .get(res.location, {
            headers: {
              [contentTypeHeaderKey]: jsonContentType
            }
          })
          .then((response) => {
            parseString(response.data, (err, result) => {
              if (err) {
                this.#logger.error(err);
                return;
              }
              this.processDevice(result.root.device);
            });
          });
      }
    });
  }

  processDevice(devices) {
    if (!devices || devices.length === 0) return;

    const device = devices[0];

    if (device?.presentationURL) {
      // Check if it's OctoPrint...

      const friendlyName = device.friendlyName[0];
      const presentationURL = device.presentationURL[0];

      if (friendlyName?.includes("OctoPrint")) {
        let url = presentationURL.substring(0, presentationURL.length - 1);

        let name = "Not Named";
        if (!friendlyName.includes("on")) {
          name = friendlyName.match(/(?:"[^"]*"|^[^"]*$)/)[0].replace(/"/g, "");
        }

        this.#logger.info("Captured device", device.location);
        this.#discoveredDevices.push({
          name: name,
          url: url
        });
      }
    }
  }

  async searchForDevicesOnNetwork() {
    this.#logger.info("Running automatic scan...");

    if (!this.#ssdpClient) {
      this.#setupSsdp();
    }

    this.#discoveredDevices = [];
    this.#ssdpClient.mSearch();

    const x = () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          this.#ssdpClient.close();
          resolve(this.#discoveredDevices);
        }, 20001);
      });
    };

    return await x();
  }
}

module.exports = AutoDiscoveryService;
