import FileManagerService from "../services/file-manager.service.js";
import UI from "./ui.js";
import Validate from "./validate.js";
import { groupBy, mapValues } from "lodash";
import { printerIsOnline } from "./octofarm.utils";

let activeFile = false;

export function dragCheck() {
  return activeFile;
}

export function dragAndDropEnable(element, printer) {
  const dropArea = document.getElementById(element.id);
  // Prevent default drag behaviors
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop area when item is dragged over it
  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(
      eventName,
      (event) => {
        activeFile = true;
        highlight(event, element);
      },
      false
    );
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(
      eventName,
      (event) => {
        activeFile = false;
        unhighlight(event, element);
      },
      false
    );
  });
  dropArea.addEventListener(
    "drop",
    (event) => {
      handleDrop(event, printer);
    },
    false
  );
}

export function dragAndDropEnableMultiplePrinters(element, printers) {
  const dropArea = document.getElementById(element.id);
  // Prevent default drag behaviors
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop area when item is dragged over it
  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(
      eventName,
      (event) => {
        activeFile = true;
        highlight(event, element);
      },
      false
    );
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(
      eventName,
      (event) => {
        activeFile = false;
        unhighlight(event, element);
      },
      false
    );
  });
  dropArea.addEventListener(
    "drop",
    (event) => {
      const selectedOnlyPrinters = printers.filter((p) => !!p.isSelected);
      handleMassDrop(event, selectedOnlyPrinters);
    },
    false
  );
}

export function dragAndDropGroupEnable(printers) {
  const groupedPrinters = mapValues(groupBy(printers, "group"));
  for (const key in groupedPrinters) {
    if (groupedPrinters.hasOwnProperty(key)) {
      if (key !== "") {
        const currentGroupEncoded = encodeURIComponent(key);
        const dropArea = document.getElementById(
          `dropPanel-${currentGroupEncoded}`
        );

        // Prevent default drag behaviors
        ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
          dropArea.addEventListener(eventName, preventDefaults, false);
          document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ["dragenter", "dragover"].forEach((eventName) => {
          dropArea.addEventListener(
            eventName,
            (event) => {
              activeFile = true;
              highlight(event, dropArea);
            },
            false
          );
        });
        ["dragleave", "drop"].forEach((eventName) => {
          dropArea.addEventListener(
            eventName,
            (event) => {
              activeFile = false;
              unhighlight(event, dropArea);
            },
            false
          );
        });
        dropArea.addEventListener(
          "drop",
          (event) => {
            handleMassDrop(event, groupedPrinters[key]);
          },
          false
        );
      }
    }
  }
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight(_e, currentElement) {
  currentElement.classList.add("highlight");
}

function unhighlight(_e, currentElement) {
  currentElement.classList.remove("highlight");
}

function handleDrop(e, currentPrinter) {
  const dt = e.dataTransfer;
  const { files } = dt;
  handleFiles(files, [currentPrinter]);
}

function handleMassDrop(e, printers) {
  const dt = e.dataTransfer;
  const { files } = dt;
  handleFiles(files, printers);
}

function sendFilesToPrinter(
  singleFileOnly,
  printAfterUpload,
  uploadableFiles,
  printer
) {
  UI.createAlert(
    "warning",
    `${Validate.getName(printer)}: started upload`,
    3000,
    "Clicked"
  );

  // Only single files can be sent to be printed immediately after upload
  if (printAfterUpload && singleFileOnly) {
    FileManagerService.handleFiles(uploadableFiles, printer, "print");
  } else {
    FileManagerService.handleFiles(uploadableFiles, printer);
  }
}

export function handleFiles(uploadableFiles, printerArray) {
  if (!printerArray || printerArray.length === 0) {
    return;
  }

  for(const printer of printerArray){
    if(!printerIsOnline(printer)){
      UI.createAlert("warning", "Your printer is not idle... this action has been aborted!", 3000, "Clicked");
      return;
    }
  }


  const singleFileOnly = uploadableFiles.length === 1;
  if (singleFileOnly) {
    bootbox.confirm({
      message: "Would you like to print upon upload?",
      buttons: {
        confirm: {
          label: "Yes",
          className: "btn-success",
        },
        cancel: {
          label: "No",
          className: "btn-danger",
        },
      },
      callback(bootBoxConfirmed) {
        printerArray.forEach((printer) => {
          sendFilesToPrinter(true, bootBoxConfirmed, uploadableFiles, printer);
        });
      },
    });
  } else {
    printerArray.forEach((printer) => {
      sendFilesToPrinter(false, false, uploadableFiles, printer);
    });
  }
}


