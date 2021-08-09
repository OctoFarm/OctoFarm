class SoftwareUpdateTask {
  #octofarmUpdateService;
  constructor({ octofarmUpdateService }) {
    this.#octofarmUpdateService = octofarmUpdateService;
  }

  async run() {
    await this.#octofarmUpdateService.syncLatestOctoFarmRelease(false).then(() => {
      this.#octofarmUpdateService.checkReleaseAndLogUpdate();
    });
  }
}

module.exports = SoftwareUpdateTask;
