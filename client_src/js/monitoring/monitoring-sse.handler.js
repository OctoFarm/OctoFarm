import currentOperations from "../lib/modules/currentOperations";
import { getViewType, setMonitoringPrinterInfo } from "./monitoring-view.state";
import { initMonitoring } from "./monitoring.updater";

let controlModal = false;
export const monitoringWorkerURL = "/monitoringInfo/get/";

export async function monitoringSSEventHandler(data) {
  if (event.data != false) {
    //Update global variables with latest information...
    const printerInfo = event.data.printersInformation;
    const printerControlList = event.data.printerControlList;

    setMonitoringPrinterInfo(printerInfo, printerControlList);

    //Grab control modal element...
    if (!controlModal) {
      controlModal = document.getElementById("printerManagerModal");
    }
    await initMonitoring(printerInfo, event.data.clientSettings, getViewType());

    if (event.data.clientSettings.panelView.currentOp) {
      const currentOperationsData = event.data.currentOperations;
      currentOperations(
        currentOperationsData.operations,
        currentOperationsData.count,
        printerInfo
      );
    }
  }
}
