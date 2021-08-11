const { UUID_LENGTH } = require("../../../constants/service.constants");

class OctoprintApiService {
  mockStatus = undefined;
  mockResponse = undefined;
  timeout = null;
  streamRejectPayload;

  constructor(timeoutSettings) {
    this.timeout = timeoutSettings;
  }

  setStreamWillError(rejectPayload = undefined) {
    this.streamRejectPayload = rejectPayload;
  }

  saveMockResponse(status, response) {
    this.mockStatus = status;
    this.mockResponse = response;
  }

  async getMockResponse() {
    return Promise.resolve({
      status: this.mockStatus,
      json: () => {
        return this.mockResponse;
      },
      body: {
        pipe: (stream) => {},
        on: (event, cb) => {
          if (event === "error") {
            if (this.streamRejectPayload) {
              return cb(this.streamRejectPayload);
            }
            return;
          } else {
            return cb(this.mockResponse);
          }
        }
      }
    });
  }

  validateInput(url, apiKey) {
    const validateURL = new URL(url);
    if (apiKey.length !== UUID_LENGTH) throw "Api key length not 32 - this is a test-only error.";
  }

  async getRetry(printerURL, apiKey, item) {
    this.validateInput(printerURL, apiKey);
    const message = `Connecting to OctoPrint Mock API: ${item} | ${printerURL}`;
    return await this.get(printerURL, apiKey, item);
  }

  post(printerURL, apiKey, route, data, timeout = true) {
    this.validateInput(printerURL, apiKey);
    const url = new URL(route, printerURL).href;
    return this.getMockResponse();
  }

  get(printerURL, apiKey, route, timeout = true) {
    this.validateInput(printerURL, apiKey);
    const url = new URL(route, printerURL).href;
    return this.getMockResponse();
  }

  patch(printerURL, apiKey, route, data, timeout = true) {
    this.validateInput(printerURL, apiKey);
    const url = new URL(route, printerURL).href;
    return this.getMockResponse();
  }

  delete(printerURL, apiKey, route) {
    this.validateInput(printerURL, apiKey);
    const url = new URL(route, printerURL).href;
    return this.getMockResponse();
  }
}

module.exports = OctoprintApiService;
