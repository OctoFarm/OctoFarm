const createAlertRules = {
  printer: "required|array",
  active: "required|boolean",
  trigger: "required|string",
  message: "required|string",
  scriptLocation: "required|string"
};

const updateAlertRules = {
  active: "required|boolean",
  trigger: "required|string",
  message: "required|string",
  scriptLocation: "required|string"
};

const testAlertScriptRules = {
  scriptLocation: "required|string",
  message: "required|string"
};

module.exports = {
  createAlertRules,
  updateAlertRules,
  testAlertScriptRules
};
