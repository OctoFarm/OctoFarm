class PrinterFilesTask {
  #printersStore;
  #settingsStore;
  #octoPrintApiService;

  constructor({ printersStore, settingsStore, octoPrintApiService }) {
    this.#printersStore = printersStore;
    this.#settingsStore = settingsStore;
    this.#octoPrintApiService = octoPrintApiService;
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
