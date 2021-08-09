const { UUID_LENGTH } = require("../../constants/service.constants");

const createPrinterRules = {
  apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|url",
  webSocketURL: "required|wsurl",
  camURL: "url"
};

module.exports = {
  createPrinterRules
};
