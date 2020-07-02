
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
        printers.forEach(async (printer, index) => {
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
            let filamentDrop = document.getElementById("filamentDrop-"+id)
             filamentDropDown.forEach(filament => {
               filamentDrop.insertAdjacentHTML('beforeend', filament)
             })
            if(printerList[index].selectedFilament != null){
                filamentDrop.value = printerList[index].selectedFilament._id
            }else{
                filamentDrop.value = 0;
            }
            filamentDrop.addEventListener('change', event => {

                 selectFilament(printerList[index]._id, event.target.value)
             });
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
        document.getElementById("fileBody").innerHTML = `
         <div class="row mb-1">
          <div class="col-12">
            <button id="fileBackBtn" type="button" class="btn btn-success float-right">
              <i class="fas fa-chevron-left"></i> Back
            </button>
            <!-- Split dropright button -->
             <div class="dropdown mr-3 float-right"
                   data-jplist-control="dropdown-sort"
                   data-opened-class="show"
                   data-group="files"
                   data-name="data-file"
                   data-id="data-file">
                
                <button
                        data-type="panel"
                        class="btn btn-primary dropdown-toggle"
                        type="button">
                    Sort by
                </button>
                
                <div
                        data-type="content"
                        class="dropdown-menu"
                        aria-labelledby="dropdownMenuButton">
                
                    <a class="dropdown-item"
                       href="#"
                       data-path="default">Sort By</a>

                     <a class="dropdown-item"
                       data-path=".name"
                       data-order="asc"
                       data-type="text"
                       data-value="1"><i class="fas fa-sort-alpha-down"></i> File Name</a>
                
                    <a class="dropdown-item"
                       data-path=".name"
                       data-order="desc"
                       data-type="text"
                       data-value="2"><i class="fas fa-sort-alpha-up"></i> File Name</a>
                                       
                    <a class="dropdown-item"
                       data-path=".time"
                       data-order="asc"
                       data-type="number"
                       data-value="3"><i class="fas fa-sort-numeric-down"></i> Print Time</a>
                
                    <a class="dropdown-item"
                       data-path=".time"
                       data-order="desc"
                       data-type="number"
                       data-value="4"><i class="fas fa-sort-numeric-up"></i> Print Time</a>
                                       
                    <a class="dropdown-item"
                       data-path=".date"
                       data-order="asc"
                       data-type="number"
                       data-value="5"><i class="fas fa-sort-numeric-down"></i> Upload Date</a>
                
                    <a class="dropdown-item"
                       data-path=".date"
                       data-order="desc"
                       data-type="number"
                       data-value="6"><i class="fas fa-sort-numeric-up"></i> Upload Date</a>
                                                           

                                                           

                          
                </div>
            </div>

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

        <div id="fileList-${id}" class="list-group" style="max-height:100%; overflow-y:scroll; min-height:1000px;" data-jplist-group="files">
            
        </div>
        `
        let printer = await OctoFarmClient.post("printers/printerInfo", {
            i: id
        });
        printer = await printer.json()

        FileManager.drawFiles(printer)

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
