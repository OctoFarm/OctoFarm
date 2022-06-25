import Calc from "../../utils/calc";
import UI from "../../utils/ui";

export const updateFileHistory = (id, success, failed) => {
  if (!id) {
    return;
  }
  if (!!success && !!failed) {
    const fileHistoryRate = document.getElementById(`fileHistoryRate-${id}`);
    UI.doesElementNeedUpdating(
      `<i class="fas fa-thumbs-up"></i> ${success} / <i class="fas fa-thumbs-down"></i> ${failed}`,
      fileHistoryRate,
      "innerHTML"
    );
  }
};
export const updateFilePrintTime = (id, expectedPrintTime) => {
  if (!id) {
    return;
  }
  if (!!expectedPrintTime) {
    const fileTime = document.getElementById(`fileTime-${id}`);
    UI.doesElementNeedUpdating(
      `${Calc.generateTime(expectedPrintTime)}`,
      fileTime,
      "innerHTML"
    );
  }
};
export const updateFileTotalCost = (id, printCost) => {
  if (!id) {
    return;
  }
  if (!!printCost) {
    const fileCost = document.getElementById(`fileCost-${id}`);
    UI.doesElementNeedUpdating(
      `Print Cost: ${printCost?.toFixed(2)}`,
      fileCost,
      "innerHTML"
    );
  }
};
export const updateFileToolUnits = (id, toolUnits, toolCosts) => {
  if (!id) {
    return;
  }
  if (!!toolUnits && !!toolCosts) {
    const fileTool = document.getElementById(`fileTool-${id}`);
    let toolInfo = "";
    toolUnits.forEach((unit, index) => {
      toolInfo += `<i class="fas fa-weight"></i> ${unit} / <i class="fas fa-dollar-sign"></i> Cost: ${toolCosts[index]}<br>`;
    });
    UI.doesElementNeedUpdating(toolInfo, fileTool, "innerHTML");
  }
};
export const updateFileUploadDate = (id, uploadDate) => {
  if (!id) {
    return;
  }
  if (!!uploadDate) {
    const fileDate = document.getElementById(`fileDate-${id}`);
    let fileUploadDate = new Date(uploadDate * 1000);
    const dateString = fileUploadDate.toDateString();
    const timeString = fileUploadDate.toTimeString().substring(0, 8);
    UI.doesElementNeedUpdating(
      `${dateString} ${timeString}`,
      fileDate,
      "innerHTML"
    );
  }
};

export const updateFileThumbnail = (id, thumbnail, printerID) => {
  if (!id) {
    return;
  }
  console.log(printerID)
  if (!!thumbnail && !!printerID) {
    const fileThumbnail = document.getElementById(`fileThumbnail-${id}`);
    const thumbnailURL = `/octoprint/${printerID}/${thumbnail}`;
    const thumbnailElement = `<span class="text-center"><img src='${thumbnailURL}' width="100%" alt="thumbnail"></span>`;
    UI.doesElementNeedUpdating(thumbnailElement, fileThumbnail, "innerHTML");
  }
};

export const updateFileSize = (id, fileSize) => {
  if (!id) {
    return;
  }
  if (!!fileSize) {
    const fileSizeEl = document.getElementById(`fileSize-${id}`);
    UI.doesElementNeedUpdating(Calc.bytes(fileSize), fileSizeEl, "innerHTML");
  }
};

export const updateMaintenanceCost = (id, maintainenceCost) => {
  if (!id) {
    return;
  }
  if (!!maintainenceCost) {
    const fileMainEl = document.getElementById(`fileMaintainenceCost-${id}`);
    UI.doesElementNeedUpdating(
      maintainenceCost.toFixed(2),
      fileMainEl,
      "innerHTML"
    );
  }
};

export const updateElectricityCost = (id, electricityCost) => {
  if (!id) {
    return;
  }
  if (!!electricityCost) {
    const fileElectEl = document.getElementById(`fileElectricityCost-${id}`);
    UI.doesElementNeedUpdating(
      electricityCost.toFixed(2),
      fileElectEl,
      "innerHTML"
    );
  }
};
