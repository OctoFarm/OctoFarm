import currentOperations from "../lib/modules/currentOperations";
import { getViewType } from "./monitoring-view.state";

export const monitoringWorkerURL = "/monitoringInfo/get/";

export async function monitoringSSEEventHandler(data) {
  if (event.data != false) {
    //Update global variables with latest information...
    printerInfo = event.data.printersInformation;
    printerControlList = event.data.printerControlList;
    //Grab control modal element...
    if (!controlModal) {
      controlModal = document.getElementById("printerManagerModal");
    }
    await init(
      event.data.printersInformation,
      event.data.clientSettings,
      getViewType()
    );
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
