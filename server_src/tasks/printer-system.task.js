/**
 * Task to fetch system/info with mostly firmware version. This is run every couple of hours as it is 50ms+ per printer
 * Note: this is a cool task which is disabled at boot and scheduled by the websocket task.
 * @type {PrinterSystemTask}
 */
class PrinterSystemTask {
  #printersStore;
  #octoPrintClient;

  constructor({ printersStore, octoPrintApiClientService }) {
    this.#printersStore = printersStore;
    this.#octoPrintClient = octoPrintApiClientService;
  }

  async run() {
    const printers = this.#printersStore.listPrinterStates();

    // TODO pool this
    for (let printer of printers) {
      await this.refreshOctoPrintSystemInfo(printer);
    }
  }

  async refreshOctoPrintSystemInfo(printerState) {
    try {
      const response = await this.#octoPrintClient.getSystemInfo(printerState.getLoginDetails());
      const data = await response.json();
      if (!!data.systeminfo) {
        printerState.updateSystemInfo(data.systeminfo);
      }
    } catch (e) {
      console.log(e.stack);
    }
  }
}

module.exports = PrinterSystemTask;