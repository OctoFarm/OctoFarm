import {DashUpdate} from "./dashboard.updater";
import UI from "../../utils/ui";
import currentOperationsService from "../../services/current-operations.service";

export const workerURL = "/dashboardInfo/get/";

export async function dashboardSSEventHandler(data) {
  if (data) {
    const currentOperationsData = data.currentOperations;
    const printerInfo = data.printerInformation;
    const dashboard = data.dashStatistics;
    const dashboardSettings = data.dashboardSettings;
    if (dashboardSettings.farmActivity.currentOperations) {
      currentOperationsService(currentOperationsData.operations, currentOperationsData.count, printerInfo);
    }

    DashUpdate.farmInformation(
      dashboard.timeEstimates,
      dashboard.utilisationGraph,
      dashboard.temperatureGraph,
      dashboardSettings
    );
    if (dashboardSettings.farmUtilisation.farmUtilisation) {
      DashUpdate.farmUtilisation(dashboard.farmUtilisation);
    }

    DashUpdate.currentStatusAndUtilisation(
      dashboard.currentStatus,
      dashboard.currentUtilisation,
      dashboardSettings.printerStates.currentStatus,
      dashboardSettings.farmUtilisation.currentUtilisation
    );

    if (dashboardSettings.printerStates.printerState) {
      DashUpdate.printerStatus(dashboard.printerHeatMaps.heatStatus);
    }

    if (dashboardSettings.printerStates.printerProgress) {
      DashUpdate.printerProgress(dashboard.printerHeatMaps.heatProgress);
    }
    if (dashboardSettings.printerStates.printerTemps) {
      DashUpdate.printerTemps(dashboard.printerHeatMaps.heatTemps);
    }
    if (dashboardSettings.printerStates.printerUtilisation) {
      DashUpdate.printerUptime(dashboard.printerHeatMaps.heatUtilisation);
    }

    if (dashboardSettings.historical.environmentalHistory) {
      await DashUpdate.environmentalData(dashboard.enviromentalData);
    }
    if (dashboardSettings.other.timeAndDate) {
      DashUpdate.dateAndTime();
    }
  } else {
    UI.createAlert(
      "warning",
      "Server Events closed unexpectedly... Retying in 10 seconds",
      10000,
      "Clicked"
    );
  }
}
