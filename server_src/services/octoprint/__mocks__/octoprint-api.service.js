class OctoprintApiService {
  timeout = null;

  constructor(timeoutSettings) {
    this.timeout = timeoutSettings;
  }

  async getRetry(printerURL, apiKey, item) {
    const message = `Connecting to OctoPrint Mock API: ${item} | ${printerURL}`;
    logger.info(`${message} | timeout: ${this.timeout.apiTimeout}`);
    return await this.get(printerURL, apiKey, item);
  }

  post(printerURL, apiKey, route, data, timeout = true, expectedData = null) {
    const url = new URL(route, printerURL).href;
    return Promise.resolve(expectedData);
  }

  get(printerURL, apiKey, route, timeout = true, expectedData = null) {
    const url = new URL(route, printerURL).href;
    return Promise.resolve(expectedData);
  }

  patch(printerURL, apiKey, route, data, timeout = true, expectedData) {
    const url = new URL(route, printerURL).href;
    return Promise.resolve(expectedData);
  }
}

module.exports = {
  OctoprintApiService
};
