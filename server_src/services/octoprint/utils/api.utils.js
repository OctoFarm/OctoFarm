const {
  jsonContentType,
  contentTypeHeaderKey,
  apiKeyHeaderKey,
  OPClientErrors
} = require("../constants/octoprint-service.constants");
const { ValidationException } = require("../../../exceptions/runtime.exceptions");

function validatePrinter(printer) {
  if (!printer.apiKey || !printer.printerURL) {
    throw new ValidationException(OPClientErrors.printerValidationErrorMessage);
  }

  return {
    apiKey: printer.apiKey,
    printerURL: printer.printerURL
  };
}

function constructHeaders(apiKey) {
  return {
    headers: {
      [contentTypeHeaderKey]: jsonContentType, // Can be overwritten without problem
      [apiKeyHeaderKey]: apiKey
    }
  };
}

function prepareRequest(printer, path, timeout = 0) {
  const { apiKey, printerURL } = validatePrinter(printer);

  let headers = constructHeaders(apiKey);

  return {
    url: new URL(path, printerURL).href,
    options: {
      headers,
      timeout
    }
  };
}

function prepareJSONRequest(printer, path, timeout = 0, data) {
  const { url, options } = prepareRequest(printer, path, timeout);

  // We must allow file uploads elsewhere, so be explicit about the content type and data in this JSON request
  options.data = data ? JSON.stringify(data) : undefined;
  options.headers[contentTypeHeaderKey] = jsonContentType;

  return {
    url,
    options
  };
}

module.exports = {
  validatePrinter,
  constructHeaders,
  prepareRequest,
  prepareJSONRequest
};
