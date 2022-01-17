const nodeInputValidator = require("node-input-validator");
const { ValidationException } = require("../exceptions/runtime.exceptions");
const mongoose = require("mongoose");

const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-API");

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

  // const hasOctoFarmTable = mongoString.includes("/octofarm");
  // this should not be a validation rule on mongo... people can call their database whatever they like!
  return {
    hasMongoPrefix,
    isValid: hasMongoPrefix
  };
}

function getExtendedValidator() {
  nodeInputValidator.extend("wsurl", ({ value, args }, validator) => {
    const url = new URL(value).href;
    return url.includes("ws://") || url.includes("wss://");
  });
  nodeInputValidator.extend("httpurl", ({ value, args }, validator) => {
    const url = new URL(value).href;
    return url.includes("http://") || url.includes("https://");
  });
  nodeInputValidator.extend("printer_id", async ({ value, args }) => {
    return mongoose.Types.ObjectId.isValid(value) || typeof value === "undefined";
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
 * @returns {function(*, *, *): *}
 */
function validateBodyMiddleware(rules) {
  return function (req, res, next) {
    validateInput(req.body, rules)
      .then((res) => {
        logger.debug("Validate Body Middelware: ", res);
        return next();
      })
      .catch((e) => {
        logger.error("Invalid body input!", e.message);
        res.statusMessage = "Invalid body input! Error:" + e.message;
        return res.sendStatus(400);
      });
  };
}

async function validateParamsMiddleware() {
  // return validateInput(req.params, rules);
}

module.exports = {
  arrayValidator,
  validateBodyMiddleware,
  validateParamsMiddleware,
  validateInput,
  validateMongoURL
};
