
import OctoFarmClient from "./lib/octofarm.js";
import Calc from "./lib/functions/calc.js";
import FileManager from "./lib/modules/fileManager.js";
import {dragAndDropEnable} from "./lib/functions/dragAndDrop.js";
import {returnDropDown, selectFilament} from "./lib/modules/filamentGrab.js";

let url = window.location.hostname;
let port = window.location.port;
if (port != "") {
    port = ":" + port;
}

let lastId = null;


//Setup global listeners...
document.getElementById("multUploadBtn").addEventListener("click", e => {
    FileManager.multiUpload();
});

class Manager{
    static async init(){
        let printers = document.querySelectorAll("[id^='fileManagerPrinter-']");
        let printerList = await OctoFarmClient.post("printers/printerInfo", {});
        printerList = await printerList.json();
        printers.forEach( async (printer, index) => {
            if (index === 0) {
                printer.classList.add("bg-dark");
                printer.classList.remove("bg-secondary");
                let first = printer.id.replace("fileManagerPrinter-", "");
                lastId = first;
                let firstElement = document.getElementById("currentPrinter");
                let printerName = document.getElementById("printerName-"+first).innerHTML;
                //Check if we're on file manager
                if(firstElement){
                    firstElement.innerHTML = "<i class=\"fas fa-print\"></i> "+printerName;
                }
            }
            let id = printer.id.replace("fileManagerPrinter-", "");
            printer.addEventListener("click", e => {
                Manager.changePrinter(e, id);
            });
            dragAndDropEnable(printer, printerList[index]);
            let filamentDropDown = await returnDropDown();
            let selectedProfile = null
            if(typeof printerList[index].current !== 'undefined' && typeof printerList[index].current.printerProfile !== 'undefined'){
                selectedProfile = printerList[index].current.printerProfile
            }
            if(selectedProfile != null && typeof printerList[index].profile[selectedProfile] != 'undefined'){
                for(let i = 0; i <printerList[index].profile[selectedProfile].extruder.count; i++){
                    let filamentDrop = document.getElementById("tool"+i+"-"+printerList[index]._id)
                    filamentDrop.innerHTML = "";
                    filamentDropDown.forEach(filament => {
                        filamentDrop.insertAdjacentHTML('beforeend', filament)
                    })
                    if(Array.isArray(printerList[index].selectedFilament) && printerList[index].selectedFilament.length !== 0){
                        if(typeof printerList[index].selectedFilament[i] !== 'undefined' && printerList[index].selectedFilament[i] !== null){
                            filamentDrop.value = printerList[index].selectedFilament[i]._id
                        }

                    }
                    filamentDrop.addEventListener('change', async event => {
                        selectFilament(printerList[index]._id, event.target.value, i);
                    });

                }
            }


        });



        let ca = printers[0].id.split("-");
        Manager.updatePrinterList(ca[1]);
    }
    static changePrinter(e, target) {
        if(!e.target.id.includes("filamentDrop")){
            //Set old one deselected
            document.getElementById("fileBody").innerHTML = "";
            document.getElementById("currentFolder").innerHTML = "local"
            document.getElementById("fileManagerPrinter-" + lastId).className =
                "list-group-item list-group-item-action flex-column align-items-start bg-secondary";
            //Update old index to this one
            lastId = target
            let printerName = document.getElementById("printerName-"+lastId).innerHTML;
            let firstElement = document.getElementById("currentPrinter");
            firstElement.innerHTML = "<i class=\"fas fa-print\"></i> "+printerName;
            Manager.updatePrinterList(target)
        }
    }
    static async updatePrinterList(id){
        let fileList = document.getElementById("fileBody");
        let fileManagerManagement = document.getElementById("fileManagerManagement");
        if(fileManagerManagement){
            fileList = fileManagerManagement;
        }
        fileList.innerHTML = `
         <div class="row mb-1">
          <div class="col-12">
         

            <label class="btn btn-success float-left mr-1 mb-0" for="fileUploadBtn"><i class="fas fa-file-import"></i> Upload File(s)</label>
            <input id="fileUploadBtn" multiple accept=".gcode,.gco,.g" type="file" class="btn btn-success float-left" id="uploadFileBtn">
            <label class="btn btn-info float-left mr-1 mb-0" for="fileUploadPrintBtn"><i class="fas fa-file-import"></i> Upload and Print</label>
            <input id="fileUploadPrintBtn" accept=".gcode,.gco,.g" type="file" class="btn btn-success float-left" id="uploadFileBtn">

            <button
                    id="createFolderBtn"
                    type="button"
                    class="btn btn-warning float-left mr-1 mb-0"
                    data-toggle="collapse"
                    href="#createFolder"
                    role="button"
                    aria-expanded="false"
                    aria-controls="createFolder"
            >
              <i class="fas fa-folder-plus"></i> Create Folder
            </button>
            <button id="fileReSync" type="button" class="btn btn-primary mb-0">
              <i class="fas fa-sync"></i> Re-Sync
            </button>
          </div>

        </div>
        `
        document.getElementById("fileBody").insertAdjacentHTML('beforeend', `
            <div id="fileList-${id}" class="list-group" style="max-height:100%; overflow-y:scroll; min-height:1000px;" data-jplist-group="files">
                
            </div>
        `)
        let printer = await OctoFarmClient.post("printers/printerInfo", {
            i: id
        });
        printer = await printer.json()

        FileManager.drawFiles(printer)
        document.getElementById("backBtn").innerHTML = `
          <button id="fileBackBtn" type="button" class="btn btn-success">
                  <i class="fas fa-chevron-left"></i> Back
                </button>`;
        let fileButtons = {
            fileManager: {
                printerStorage: document.getElementById("printerStorage"),
                fileFolderCount: document.getElementById("printerFileCount"),
                fileSearch: document.getElementById("searchFiles"),
                uploadFiles: document.getElementById("fileUploadBtn"),
                uploadPrintFile: document.getElementById("fileUploadPrintBtn"),
                syncFiles: document.getElementById("fileReSync"),
                back: document.getElementById("fileBackBtn"),
                createFolderBtn: document.getElementById("createFolderBtn")
            }
        };
        fileButtons.fileManager.fileFolderCount.innerHTML = `<i class="fas fa-file"></i> ${printer.filesList.fileCount} <i class="fas fa-folder"></i> ${printer.filesList.folderCount}`;
        fileButtons.fileManager.printerStorage.innerHTML = `<i class="fas fa-hdd"></i> ${Calc.bytes(printer.storage.free)} / ${Calc.bytes(printer.storage.total)}`
        fileButtons.fileManager.uploadFiles.addEventListener('change', function() {
            FileManager.handleFiles(this.files, printer);
        });
        fileButtons.fileManager.createFolderBtn.addEventListener("click", e => {
            FileManager.createFolder(printer)
        });
        fileButtons.fileManager.fileSearch.addEventListener("keyup", e => {
            FileManager.search(printer._id);
        });
        fileButtons.fileManager.uploadPrintFile.addEventListener("change", function() {
            FileManager.handleFiles(this.files, printer, "print")
        });
        fileButtons.fileManager.back.addEventListener("click", e => {
            FileManager.openFolder(undefined, undefined, printer);
        });
        fileButtons.fileManager.syncFiles.addEventListener('click', e => {
            FileManager.reSyncFiles(e, printer);
        });
    }

}
Manager.init();
