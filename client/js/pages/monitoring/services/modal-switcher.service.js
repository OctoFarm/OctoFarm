import {getControlList, getPrinterInfo} from "../monitoring-view.state";
import {initialiseCurrentJobPopover} from "./printer-current-job.service";
import PrinterControlManagerService from "./printer-control-manager.service";
import PrinterFileManagerService from "./printer-file-manager.service";
import PrinterTerminalManagerService from "./printer-terminal-manager.service";
import {printerIsOnline, printerIsPrintingOrComplete} from "../../../utils/octofarm.utils";

const currentOpenModal = document.getElementById("printerManagerModalTitle");

const printerControlsTemplate = (page, printer) => {
    const active = "active";

    const isOffline = !printerIsOnline(printer);
    const isPrintingOrComplete = printerIsPrintingOrComplete(printer);
    const disabledControl = isOffline ? "disabled" : ""
    const disabledFiles = isOffline ? "disabled" : ""
    const disabledTerminal = isOffline ? "disabled" : ""
    const disabledJobInfo = !isPrintingOrComplete ? "disabled" : ""

    return `
        <div id="modalSwitcher" class="row">
            <div class="col-lg-3"></div>
            <div class="col-lg-6 text-center my-2">
               <div class="btn-group btn-block" role="group" aria-label="Basic example">
                 <button id="modalSwitcherInfo" type="button" class="btn btn-outline-info ${(page === "info") ? active : ""}" ${disabledJobInfo}><i class="fa-solid fa-circle-info"></i></button>
                 <button id="modalSwitcherFiles" type="button" class="btn btn-outline-warning ${(page === "file") ? active : ""}" ${disabledFiles}><i class="fas fa-file-code"></i></button>
                 <button id="modalSwitcherControl" type="button" class="btn btn-outline-success ${(page === "control") ? active : ""}" ${disabledControl}><i class="fas fa-print"></i></button>
                 <button id="modalSwitcherTerminal" type="button" class="btn btn-outline-info ${(page === "terminal") ? active : ""}" ${disabledTerminal}><i class="fas fa-terminal"></i></button>
               </div>
            </div>    
            <div class="col-lg-3"></div>
        </div>
       
    `
}

export const setupModalSwitcher = (page, printer) => {
    const { _id } = printer
    const printerControls = document.getElementById("printerControls");
    if(!document.getElementById("modalSwitcher")){
        printerControls.insertAdjacentHTML("afterbegin", printerControlsTemplate(page, printer))
        addModalSwitcherListeners(_id);
    }

}

const addModalSwitcherListeners = (id) => {
    const modalSwitcherInfo = document.getElementById("modalSwitcherInfo")
    const modalSwitcherFiles = document.getElementById("modalSwitcherFiles")
    const modalSwitcherControl = document.getElementById("modalSwitcherControl")
    const modalSwitcherTerminal = document.getElementById("modalSwitcherTerminal")
    modalSwitcherInfo.addEventListener("click", async () => {
        currentOpenModal.innerHTML = "Printer Job Status: ";
        const printerInfo = getPrinterInfo();
        const controlList = getControlList();
        await initialiseCurrentJobPopover(id, printerInfo, controlList);
    })
    modalSwitcherFiles.addEventListener("click", async () => {
        currentOpenModal.innerHTML = "Printer Files: ";
        const printerInfo = getPrinterInfo();
        const controlList = getControlList();
        await PrinterFileManagerService.init(
            id,
            printerInfo,
            controlList
        );
    })
    modalSwitcherControl.addEventListener("click", async () => {
        currentOpenModal.innerHTML = "Printer Control: ";
        const printerInfo = getPrinterInfo();
        const controlList = getControlList();
        await PrinterControlManagerService.init(
            id,
            printerInfo,
            controlList
        );
    })
    modalSwitcherTerminal.addEventListener("click", async () => {
        currentOpenModal.innerHTML = "Printer Terminal: ";
        const printerInfo = getPrinterInfo();
        const controlList = getControlList();
        await PrinterTerminalManagerService.init(
            id,
            printerInfo,
            controlList
        );
    })
}
