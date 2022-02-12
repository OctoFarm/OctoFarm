const nodeInputValidator = require("node-input-validator");
const { ValidationException } = require("../exceptions/runtime.exceptions");
const mongoose = require("mongoose");

const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-Validation");

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
  nodeInputValidator.extend("settings_appearance", async ({ value, args }) => {
    const { color, colorTransparent, defaultLanguage, name, showFahrenheitAlso } = value;
    const colorValid = !!color && typeof color === "string" && color === "default"; //The client will always send default for adding a printer
    const colorTransparentValid =
      typeof colorTransparent === "boolean" && colorTransparent === false;
    const defaultLanguageValid = !!defaultLanguage && typeof defaultLanguage === "string";
    const nameValid = !!name && typeof name === "string" && (name.length === 0 || name.length < 50); // Can be blank, must be less than 50 characters
    const showFahrenheitAlsoValid = typeof showFahrenheitAlso === "boolean";

    logger.debug(`
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
  nodeInputValidator.extend("camera_url", async ({ value, args }) => {
    console.log("VALIDATE CAM");
    console.log(value, args);
  });
  nodeInputValidator.extend("apikey", async ({ value, args }) => {
    console.log("VALIDATE API");
    console.log(value, args);
  });
  nodeInputValidator.extend("group", async ({ value, args }) => {
    console.log("VALIDATE GROUP");
    console.log(value, args);
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
        console.log(res);
        logger.debug("Validate Body Middelware: ", res);
        return next();
      })
      .catch((e) => {
        const errorMessage = "Invalid body input! Error:" + e.message;
        logger.error(errorMessage);
        res.statusCode = 400;
        res.statusMessage = errorMessage;
        return res.send({ error: errorMessage });
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
