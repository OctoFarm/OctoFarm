const nodeInputValidator = require("node-input-validator");
const { ValidationException } = require("../exceptions/runtime.exceptions");
const mongoose = require("mongoose");

const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-Validation");

// REFACTOR should be a utility -_-
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
  nodeInputValidator.extend("wss_url", ({ value, args }) => {
    const url = new URL(value).href;
    return url.includes("ws://") || url.includes("wss://");
  });
  nodeInputValidator.extend("printer_id", async ({ value, args }) => {
    return mongoose.Types.ObjectId.isValid(value) || typeof value === "undefined";
  });
  //TODO this needs a custom message passing back out, can remove the logger then.
  nodeInputValidator.extend("settings_appearance", async ({ value, args }) => {
    const { color, colorTransparent, defaultLanguage, name, showFahrenheitAlso } = value;
    const colorValid = typeof color === "string" && color === "default"; //The client will always send default for adding a printer
    const colorTransparentValid =
      typeof colorTransparent === "boolean" && colorTransparent === false;
    const defaultLanguageValid =
      typeof defaultLanguage === "string" && defaultLanguage === "_default";
    const nameValid = typeof name === "string" && name.length < 50; // Can be blank, must be less than 50 characters
    const showFahrenheitAlsoValid = typeof showFahrenheitAlso === "boolean";

    logger.info(`
      Color is Valid: ${colorValid},
      Colour Transparent is Valid: ${colorTransparentValid},
      Default Language is Valid: ${defaultLanguageValid},
      Name is Valid: ${nameValid},
      Show Fahrenheit Is Valid: ${showFahrenheitAlsoValid}
    `);

    return ![
      colorValid,
      colorTransparentValid,
      defaultLanguageValid,
      nameValid,
      showFahrenheitAlsoValid
    ].includes(false);
  });
  nodeInputValidator.extend("apikey", async ({ value, args }) => {
    const { apikey } = value;
    return !!apikey && typeof apikey === "string" && apikey.length === 32;
  });
  nodeInputValidator.extend("group", async ({ value, args }) => {
    const { group } = value;
    return (!!group && group.length === 0) || group.length < 50;
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
 * @param rules
 * @returns {function(*, *, *): *}
 */
function validateBodyMiddleware(rules) {
  return function (req, res, next) {
    validateInput(req.body, rules)
      .then((res) => {
        logger.debug("Validated Body Middleware");
        return next();
      })
      .catch((e) => {
        const errorMessage =
          "Invalid body input detected in " +
          req.protocol +
          "://" +
          req.get("host") +
          req.originalUrl;
        logger.error(errorMessage, e);
        res.statusCode = 400;
        res.statusMessage = e;
        return res.send(e);
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
