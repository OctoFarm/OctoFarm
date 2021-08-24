class AxiosMock {
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
      response: {
        status: this.mockStatus,
        data: {
          pipe: (stream) => {},
          on: (event, cb) => {
            if (event === "error") {
              if (this.streamRejectPayload) {
                return cb(this.streamRejectPayload);
              }
            } else {
              return cb(this.mockResponse);
            }
          }
        }
      }
    });
  }

  get() {
    return this.getMockResponse();
  }

  post() {
    return this.getMockResponse();
  }

  patch() {
    return this.getMockResponse();
  }

  delete() {
    return this.getMockResponse();
  }
}

module.exports = AxiosMock;
