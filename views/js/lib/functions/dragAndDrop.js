import FileManager from "../modules/fileManager.js";
import UI from "../functions/ui.js";
import Validate from "../functions/validate.js";

export async function dragAndDropEnable(element, printer){
    let dropArea = document.getElementById(element.id);
    // Prevent default drag behaviors
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ["dragenter", "dragover"].forEach(eventName => {
        dropArea.addEventListener(eventName, event => {
           highlight(event, element)
        }, false);
    });
    ["dragleave", "drop"].forEach(eventName => {
        dropArea.addEventListener(eventName, event => {
            unhighlight(event, element)
        }, false);
    });
    dropArea.addEventListener("drop", event => {
        handleDrop(event, printer)
    }, false);
}
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}
function highlight(e, currentElement) {
    currentElement.classList.add("highlight");
}
function unhighlight(e, currentElement) {
    currentElement.classList.remove("highlight");
}
function handleDrop(e, currentPrinter, currentElement) {
    let dt = e.dataTransfer;
    let files = dt.files;
    handleFiles(files , currentPrinter, currentElement);
}
export function handleFiles(Afiles, currentPrinter) {
        if(Afiles.length === 1){
            bootbox.confirm({
                message: "Would you like to print upon upload?",
                buttons: {
                    confirm: {
                        label: 'Yes',
                        className: 'btn-success'
                    },
                    cancel: {
                        label: 'No',
                        className: 'btn-danger'
                    }
                },
                callback: function (result) {
                    if(result){
                        UI.createAlert("warning", `${Validate.getName(currentPrinter)}: started upload`, 3000, "Clicked")
                        FileManager.handleFiles(Afiles, currentPrinter, "print");
                    }else{
                        UI.createAlert("warning", `${Validate.getName(currentPrinter)}: started upload`, 3000, "Clicked")
                        FileManager.handleFiles(Afiles, currentPrinter);
                    }
                }
            });
        }else{
            UI.createAlert("warning", `${Validate.getName(currentPrinter)}: started upload`, 3000, "Clicked")
            FileManager.handleFiles(Afiles, currentPrinter);
        }
}