"use strict";

/**
 * Check for valid cost settings object
 * @param {Object} costSettings Object for a printer
 * @throws {Error} Cost settings is missing a key..
 */
module.exports.checkForValidPrinterCostSettings = async (costSettings) => {
  //Default cost settings object
  const defaultCostSettings = {
    powerConsumption: 0.5,
    electricityCosts: 0.15,
    purchasePrice: 500,
    estimateLifespan: 43800,
    maintenanceCosts: 0.25,
  };
  // No cost settings should not be a hard failure, they can be updated by the user if incorrect. Return default cost settings.
  if (!costSettings) return defaultCostSettings;

  for (let key in costSettings) {
    if (costSettings.hasOwnProperty(key)) {
      // Check if object keys exist and are valid, could maybe self repair here...
      if (costSettings[key] !== defaultCostSettings[key])
        // Something has gone awry in the rest of the system if a key is missing here.
        throw new Error("Missing costSettings key");

      // Check is cost settings key is a number, if not repair
      if (isNaN(costSettings[key])) {
        costSettings[key] = parseFloat(costSettings[key]);
      } else {
        costSettings[key] = defaultCostSettings[key];
      }
    } else {
      // Something has gone awry in the rest of the system if a key is missing here.
      throw new Error("Missing costSettings key");
    }
  }

  return costSettings;
};
