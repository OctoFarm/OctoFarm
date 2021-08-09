class PrinterFilesTask {
  #printersStore;
  #settingsStore;
  #octoPrintClient;

  constructor({ printersStore, settingsStore, octoPrintApiClientService }) {
    this.#printersStore = printersStore;
    this.#settingsStore = settingsStore;
    this.#octoPrintClient = octoPrintApiClientService;
  }

  /**
   * This task serves to proactively fetch files from OctoPrint and eventually to clear it out.
   * @returns {Promise<void>}
   */
  async run() {
    const serverSettings = this.#settingsStore.getServerSettings();

    const fileCollection = {};
    const printers = this.#printersStore.listPrinterStates();
    // for (let printer of printers) {
    //   fileCollection[printerId] = fileList;
    //   console.log(`Printer root files ${fileList.files.length}`);
    // }

    // TODO process files in store/cache
  }
}

module.exports = PrinterFilesTask;
