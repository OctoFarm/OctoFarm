const nodeInputValidator = require("node-input-validator");
const { ValidationException } = require("../exceptions/runtime.exceptions");

const arrayValidator = function arrayLengthValidator(minIncl = null, maxIncl = null) {
  return (arrayValue) => {
    let isMinLength = true;
    let isMaxLength = true;
    if (!!minIncl) {
      isMinLength = arrayValue.length >= minIncl;
    }
    if (!!maxIncl) {
      isMaxLength = arrayValue.length <= maxIncl;
    }
    return isMinLength && isMaxLength;
  };
};

function validateMongoURL(mongoURL) {
  const mongoString = mongoURL.toLowerCase();
  const hasMongoPrefix =
    mongoString.toLowerCase().includes("mongodb://") ||
    mongoString.toLowerCase().includes("mongodb+srv://");
  const hasOctoFarmTable = mongoString.includes("/octofarm");

  return {
    hasMongoPrefix,
    hasOctoFarmTable,
    isValid: hasOctoFarmTable || hasMongoPrefix
  };
}

function getExtendedValidator() {
  nodeInputValidator.extend("wsurl", ({ value, args }, validator) => {
    if (!value) return false;
    const url = new URL(value).href;
    return url.includes("ws://") || url.includes("wss://");
  });
  nodeInputValidator.extend("httpurl", ({ value, args }, validator) => {
    if (!value) return false;
    const url = new URL(value).href;
    return url.includes("http://") || url.includes("https://");
  });
  return nodeInputValidator;
}

async function validateInput(data, rules) {
  const localNIV = getExtendedValidator();

  const v = new localNIV.Validator(data, rules);

  const matched = await v.check();
  if (!matched) {
    throw new ValidationException(v.errors);
  }
  return v.inputs;
}

/**
 * Handle API input validation
 * @param req
 * @param rules
 * @param res
 * @returns {Promise<boolean|any>}
 */
async function validateMiddleware(req, rules, res) {
  return validateInput(req.body, rules);
}

module.exports = {
  arrayValidator,
  validateMiddleware,
  validateInput,
  validateMongoURL
};
