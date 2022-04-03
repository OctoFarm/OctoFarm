import {
    drawFiles,
    drawFolders,
    getFileListElement,
    updateListeners,
    updatePrinterMetrics
} from "./file-manager.helpers";

export const doesFileExist = () => {

}

export const createFile = () => {

}

export const moveFile = () => {

}

export const updatePrinterFilesList = (printer, recursive) => {
    const { fileList } = printer;
    const fileElem = getFileListElement(printer._id);
    fileElem.innerHTML = "";
    // Update page elements
    const currentFolder = updatePrinterMetrics(
        printer._id,
        fileList.fileList,
        fileList.folderList
    );
    //Draw folders,
    if (!recursive) {
        drawFolders(
            printer._id,
            fileList.folderList,
            currentFolder
        );
    }

    // Draw Files,
    drawFiles(
        printer._id,
        fileList.fileList,
        printer.printerURL,
        currentFolder,
        recursive
    );

    // Update Listeners
    updateListeners(printer);
}