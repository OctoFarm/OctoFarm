// Store the current active view type like camera, panel, location map or list
import OctoFarmClient from "../../services/octofarm-client.service";

let currentViewType = "none";
const viewTypes = [
  "panel",
  "list",
  "camera",
  "group",
  "current-ops",
  "combined",
];

let printerInfo = null;
let printerControlList = null;

/**
 * Let the monitoring view updater handle the proper view type
 * @param inputViewType
 */
export function setViewType(inputViewType) {
  if (!viewTypes.includes(inputViewType)) {
    console.warn("Monitoring view: Unknown view type set");
  }

  currentViewType = inputViewType;
}

export function getViewType() {
  return currentViewType;
}

/**
 * Set the state passed down from the server regularly
 * @param newPrinterInfo
 * @param controlList
 */
export function setMonitoringPrinterInfo(newPrinterInfo, controlList) {
  printerInfo = newPrinterInfo;
  printerControlList = controlList;
}

export function getPrinterInfo() {
  return printerInfo;
}

export function getControlList() {
  return printerControlList;
}


const currentOperationsSorting = document.getElementById(
    "currentOperationsChangeSortOrder"
);
console.log(currentOperationsSorting)
if (currentOperationsSorting) {
  OctoFarmClient.getCurrentOpState()
      .then((res) => {
        // Apply state
        const { currentIterie, currentOrder } = res;
        console.log("HLLO")
        if (currentIterie === "progress" && currentOrder === "desc") {
          currentOperationsSorting.innerHTML =
              document.getElementById("ci-progress-down").innerHTML;
        }
        if (currentIterie === "progress" && currentOrder === "asc") {
          currentOperationsSorting.innerHTML =
              document.getElementById("ci-progress-up").innerHTML;
        }
        if (currentIterie === "timeRemaining" && currentOrder === "desc") {
          currentOperationsSorting.innerHTML =
              document.getElementById("ci-time-down").innerHTML;
        }
        if (currentIterie === "timeRemaining" && currentOrder === "asc") {
          currentOperationsSorting.innerHTML =
              document.getElementById("ci-time-up").innerHTML;
        }
        if (currentIterie === "fileName" && currentOrder === "desc") {
          currentOperationsSorting.innerHTML =
              document.getElementById("ci-file-down").innerHTML;
        }
        if (currentIterie === "fileName" && currentOrder === "asc") {
          currentOperationsSorting.innerHTML =
              document.getElementById("ci-file-up").innerHTML;
        }
        if (currentIterie === "sortIndex" && currentOrder === "desc") {
          currentOperationsSorting.innerHTML =
              document.getElementById("ci-index-down").innerHTML;
        }
        if (currentIterie === "sortIndex" && currentOrder === "asc") {
          currentOperationsSorting.innerHTML =
              document.getElementById("ci-index-up").innerHTML;
        }
        document
            .getElementById("ci-progress-up")
            .addEventListener("click", async () => {
              currentOperationsSorting.innerHTML =
                  document.getElementById("ci-progress-up").innerHTML;
              await OctoFarmClient.updateCurrentOpState({
                iterie: "progress",
                order: "asc",
              });
            });
        document
            .getElementById("ci-progress-down")
            .addEventListener("click", async () => {
              currentOperationsSorting.innerHTML =
                  document.getElementById("ci-progress-down").innerHTML;
              await OctoFarmClient.updateCurrentOpState({
                iterie: "progress",
                order: "desc",
              });
            });
        document
            .getElementById("ci-time-up")
            .addEventListener("click", async () => {
              currentOperationsSorting.innerHTML =
                  document.getElementById("ci-time-up").innerHTML;
              await OctoFarmClient.updateCurrentOpState({
                iterie: "timeRemaining",
                order: "asc",
              });
            });
        document
            .getElementById("ci-time-down")
            .addEventListener("click", async () => {
              currentOperationsSorting.innerHTML =
                  document.getElementById("ci-time-down").innerHTML;
              await OctoFarmClient.updateCurrentOpState({
                iterie: "timeRemaining",
                order: "desc",
              });
            });
        document
            .getElementById("ci-file-up")
            .addEventListener("click", async () => {
              currentOperationsSorting.innerHTML =
                  document.getElementById("ci-file-up").innerHTML;
              await OctoFarmClient.updateCurrentOpState({
                iterie: "fileName",
                order: "asc",
              });
            });
        document
            .getElementById("ci-file-down")
            .addEventListener("click", async () => {
              currentOperationsSorting.innerHTML =
                  document.getElementById("ci-file-down").innerHTML;
              await OctoFarmClient.updateCurrentOpState({
                iterie: "fileName",
                order: "desc",
              });
            });
        document
            .getElementById("ci-index-up")
            .addEventListener("click", async () => {
              currentOperationsSorting.innerHTML =
                  document.getElementById("ci-index-up").innerHTML;
              await OctoFarmClient.updateCurrentOpState({
                iterie: "sortIndex",
                order: "asc",
              });
            });
        document
            .getElementById("ci-index-down")
            .addEventListener("click", async () => {
              currentOperationsSorting.innerHTML =
                  document.getElementById("ci-index-down").innerHTML;
              await OctoFarmClient.updateCurrentOpState({
                iterie: "sortIndex",
                order: "desc",
              });
            });
      })
      .catch((e) => {
        console.error("Current Operations error!", e.toString())
      });
}