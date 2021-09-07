const { UUID_LENGTH } = require("../../constants/service.constants");

const stepSizeRules = {
  stepSize: "required|in:01,1,10,100|numeric"
};

const flowRateRules = {
  flowRate: "required|between:75,125|integer"
};

const feedRateRules = {
  feedRate: "required|between:10,200|integer"
};

const updateSortIndexRules = {
  sortList: "required|array|minLength:1",
  "sortList.*": "required|mongoId"
};

const updatePrinterEnabledRule = {
  enabled: `required|boolean`
};

const updatePrinterConnectionSettingRules = {
  printer: "required|object",
  "printer.id": "required|mongoId", // Changed from index to id
  "printer.printerURL": "required|httpurl",
  "printer.webSocketURL": "required|wsurl", // Changed from protocol to url
  "printer.camURL": "httpurl",
  "printer.apiKey": `required|minLength:${UUID_LENGTH}|maxLength:${UUID_LENGTH}`
};

module.exports = {
  stepSizeRules,
  feedRateRules,
  flowRateRules,
  updateSortIndexRules,
  updatePrinterEnabledRule,
  updatePrinterConnectionSettingRules
};
