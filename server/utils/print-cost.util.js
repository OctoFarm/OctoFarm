const noCostSettingsMessage = "No cost settings to calculate from";

/**
 * Calculate the cost of printing
 * @param printTime
 * @param costSettings
 * @returns {number|null}
 */
function getMaintenanceCosts(printTime, costSettings) {
  if (!costSettings) {
    // Attempt to update cost settings in history...
    return noCostSettingsMessage;
  }
  // calculating printer cost
  const purchasePrice = parseFloat(costSettings.purchasePrice);
  const lifespan = parseFloat(costSettings.estimateLifespan);
  const depreciationPerHour = lifespan > 0 ? purchasePrice / lifespan : 0;
  const maintenancePerHour = parseFloat(costSettings.maintenanceCosts);
  const estimatedPrintTime = getEstimatedPrintTime(printTime);

  const cost = (depreciationPerHour + maintenancePerHour) * estimatedPrintTime;

  // assembling string
  return !!cost ? cost : 0;
}

function getEstimatedPrintTime(printTime) {
  return printTime / 3600;
}

function getElectricityCosts(printTime, costSettings) {
  if (!costSettings) {
    return noCostSettingsMessage;
  }
  const powerConsumption = parseFloat(costSettings.powerConsumption);
  const costOfElectricity = parseFloat(costSettings.electricityCosts);
  const costPerHour = powerConsumption * costOfElectricity;
  const estimatedPrintTime = getEstimatedPrintTime(printTime); // h

  const cost = costPerHour * estimatedPrintTime;

  return !!cost ? cost : 0;
}

module.exports = {
  noCostSettingsMessage,
  getMaintenanceCosts,
  getElectricityCosts
};
