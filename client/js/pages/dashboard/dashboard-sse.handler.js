import { DashUpdate } from "./dashboard.updater";
import UI from "../../utils/ui";

export const workerURL = "/dashboardInfo/get/";

//REFACTOR move over the proper SSE Handler... no need for it to have it's own.
export async function dashboardSSEventHandler(data) {
  if (data) {
    const dashboard = data.dashStatistics;
    const dashboardSettings = data.dashboardSettings;
    const cameraList = data.cameraList

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
    if(dashboardSettings.other.cameraCarousel){
      DashUpdate.cameraCarousel(cameraList);
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
