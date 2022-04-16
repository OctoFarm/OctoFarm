import {
    updateFileHistory,
    updateFilePrintTime, updateFileThumbnail,
    updateFileToolUnits,
    updateFileTotalCost, updateFileUploadDate,
    updateFileSize
} from "./file-information-update.helpers";

export function updateLiveFileInformation(id, data) {
    if (!!id && !!data) {
        const fileCard = document.getElementById(`file-${id}`);
        if(!!fileCard){
            const { expectedPrintTime, failed, fileSize, printCost, success, thumbnail, toolCosts, toolUnits, uploadDate } = data.value;
            updateFileHistory(id, success, failed);
            updateFilePrintTime(id, expectedPrintTime);
            updateFileTotalCost(id, printCost);
            updateFileToolUnits(id, toolUnits, toolCosts)
            updateFileUploadDate(id, uploadDate);
            updateFileSize(id, fileSize);
            // Handle extra keys / information, usually plugins...
            const { additionalInformation } = data;
            if(!!additionalInformation){
                updateFileThumbnail(id, thumbnail, additionalInformation.printerURL);
            }
        }
    }
}
