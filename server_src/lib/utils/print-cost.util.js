const noCostSettingsMessage = "No cost settings to calculate from";

function getPrintCost(printTime, costSettings) {
  if (!costSettings) {
    // Attempt to update cost settings in history...
    return noCostSettingsMessage;
  }
  // calculating electricity cost
  const powerConsumption = parseFloat(costSettings.powerConsumption);
  const costOfElectricity = parseFloat(costSettings.electricityCosts);
  const costPerHour = powerConsumption * costOfElectricity;
  const estimatedPrintTime = printTime / 3600; // h
  const electricityCost = costPerHour * estimatedPrintTime;

  // calculating printer cost
  const purchasePrice = parseFloat(costSettings.purchasePrice);
  const lifespan = parseFloat(costSettings.estimateLifespan);
  const depreciationPerHour = lifespan > 0 ? purchasePrice / lifespan : 0;
  const maintenancePerHour = parseFloat(costSettings.maintenanceCosts);
  const printerCost =
    (depreciationPerHour + maintenancePerHour) * estimatedPrintTime;
  // assembling string
  const estimatedCost = electricityCost + printerCost;
  return estimatedCost.toFixed(2);
}

module.exports = {
  noCostSettingsMessage,
  getPrintCost,
};
