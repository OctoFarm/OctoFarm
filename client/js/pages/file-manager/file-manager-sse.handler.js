import {
    updateCostOnFileCard,
    updateExpectedPrintTimeOnFileCard, updateFileUploadDateOnFileCard,
    updateSuccessFailedOnFileCard, updateToolInfoOnFileCard
} from "./file-manager.helpers";
export function updateLiveFileInformation(id, data) {
    if (!!id && !!data) {
        const fileCard = document.getElementById(`file-${id}`);
        if(!!fileCard){
            const { failed, success, expectedPrintTime, printCost, toolUnits, toolCosts, uploadDate } = data.value;

            updateSuccessFailedOnFileCard(id, success, failed);
            updateExpectedPrintTimeOnFileCard(id, expectedPrintTime);
            updateCostOnFileCard(id, printCost);
            updateToolInfoOnFileCard(id, toolUnits, toolCosts);
            updateFileUploadDateOnFileCard(id, uploadDate);

        }
    }
}
