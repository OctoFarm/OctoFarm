import Calc from "../../utils/calc";

export const generatePathList = (folderList) => {
  const options = [];
  const loc = {
    text: "local",
    value: "/",
  };
  options.push(loc);
  folderList.forEach((folder) => {
    const option = {
      text: folder.name,
      value: folder.name,
    };
    options.push(option);
  });
  return options;
};
export const getCurrentUploadLimit = () => {};
export const setCurrentUploadLimit = () => {};
export const getFileListElement = (id) => {
  return document.getElementById(`fileList-${id}`);
};
export const updateSuccessFailedOnFileCard = (id, success, failed) => {
  if(!!success && !!failed){
    const fileHistoryRate = document.getElementById(`fileHistoryRate-${id}`);
    fileHistoryRate.innerHTML = `
                <i class="fas fa-thumbs-up"></i> ${
        success
    } / <i class="fas fa-thumbs-down"></i> ${failed}
            `
  }
}
export const updateExpectedPrintTimeOnFileCard = (id, expectedPrintTime) => {
  if(!!expectedPrintTime){
    const fileTime = document.getElementById(`fileTime-${id}`);
    fileTime.innerHTML = `
                 ${Calc.generateTime(expectedPrintTime)}
            `
  }
}
export const updateCostOnFileCard = (id, printCost) => {
  if(!!printCost){
    const fileCost = document.getElementById(`fileCost-${id}`);
    fileCost.innerHTML = `
                Print Cost: ${printCost?.toFixed(2)} 
            `
  }
}
export const updateToolInfoOnFileCard = (id, toolUnits, toolCosts) => {
  const fileTool = document.getElementById(`fileTool-${id}`);
  let toolInfo = "";
  toolUnits.forEach((unit, index) => {
    toolInfo += `<i class="fas fa-weight"></i> ${unit} / <i class="fas fa-dollar-sign"></i> Cost: ${toolCosts[index]}<br>`;
  });
  fileTool.innerHTML = `
                ${toolInfo}
            `
}
export const updateFileUploadDateOnFileCard = (id, uploadDate) => {
  if(!!uploadDate){
    const fileDate = document.getElementById(`fileDate-${id}`);
    let fileUploadDate = new Date(uploadDate * 1000);
    const dateString = fileUploadDate.toDateString();
    const timeString = fileUploadDate.toTimeString().substring(0, 8);
    fileDate.innerHTML = `
                ${dateString} ${timeString}
            `
  }

}