const { UUID_LENGTH } = require("../../constants/service.constants");

const createPrinterRules = {
  apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
  webSocketURL: "required|wsurl",
  camURL: "httpurl"
};

module.exports = {
  createPrinterRules
};
