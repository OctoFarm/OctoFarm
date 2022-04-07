import Calc from "../../utils/calc"
export function updateLiveFileInformation(id, data) {
    if (!!id && !!data) {
        const fileCard = document.getElementById(`file-${id}`);
        if(!!fileCard){
            const { failed, success, expectedPrintTime, printCost, toolUnits, toolCosts, uploadDate } = data.value;
            const fileHistoryRate = document.getElementById(`fileHistoryRate-${id}`);
            fileHistoryRate.innerHTML = `
                <i class="fas fa-thumbs-up"></i> ${
                success
            } / <i class="fas fa-thumbs-down"></i> ${failed}
            `
            const fileTime = document.getElementById(`fileTime-${id}`);
            fileTime.innerHTML = `
                 ${Calc.generateTime(expectedPrintTime)}
            `
            const fileCost = document.getElementById(`fileCost-${id}`);
            fileCost.innerHTML = `
                Print Cost: ${printCost?.toFixed(2)} 
            `
            const fileTool = document.getElementById(`fileTool-${id}`);
            let toolInfo = "";
            toolUnits.forEach((unit, index) => {
                toolInfo += `<i class="fas fa-weight"></i> ${unit} / <i class="fas fa-dollar-sign"></i> Cost: ${toolCosts[index]}<br>`;
            });
            fileTool.innerHTML = `
                ${toolInfo}
            `
            const fileDate = document.getElementById(`fileDate-${id}`);
            let fileUploadDate = new Date(uploadDate * 1000);
            const dateString = fileUploadDate.toDateString();
            const timeString = fileUploadDate.toTimeString().substring(0, 8);
            fileDate.innerHTML = `
                ${dateString} ${timeString}
            `
        }
    }
}
