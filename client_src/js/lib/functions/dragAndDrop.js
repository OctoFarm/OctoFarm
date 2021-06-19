import FileManager from "../modules/fileManager.js";
import UI from "./ui.js";
import Validate from "./validate.js";

let activeFile = false;

export async function dragCheck() {
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
  const dt = e.dataTransfer;
  const { files } = dt;
  handleFiles(files, [currentPrinter], currentElement);
}

function handleMassDrop(e, printers, currentElement) {
  const dt = e.dataTransfer;
  const { files } = dt;
  handleFiles(files, printers, currentElement);
}

function sendFilesToPrinter(singleFileOnly, printAfterUpload, uploadableFiles, printer) {
  UI.createAlert(
    "warning",
    `${Validate.getName(printer)}: started upload`,
    3000,
    "Clicked"
  );

  // Only single files can be sent to be printed immediately after upload
  if (printAfterUpload && singleFileOnly) {
    FileManager.handleFiles(uploadableFiles, printer, "print");
  } else {
    FileManager.handleFiles(uploadableFiles, printer);
  }
}

export function handleFiles(uploadableFiles, printerArray) {
  if (!printerArray || printerArray.length === 0) {
    return;
  }
  if (uploadableFiles.length > 1) {
    UI.createAlert(
      "error",
      `Cant upload and run multiple gcode files. Try again with 1 .gcode file.`,
      4000,
      "Clicked"
    );
    return;
  }
  if (!uploadableFiles[0].name.endsWith(".gcode")) {
    UI.createAlert(
      "error",
      `Cant upload a file without .gcode extension. Pak dat spieskanon maar, spiesje voor jou.`,
      4000,
      "Clicked"
    );
    return;
  }

  const printerNamesJoined = printerArray?.map(p => p.printerName.replace("https://", "").replace("http://", ""))?.join(", ");
  UI.createAlert(
    "success",
    `Started upload and print to these printers: ${printerNamesJoined}.`,
    4000,
    "Clicked"
  );
  printerArray.forEach(printer => {
    sendFilesToPrinter(true, true, uploadableFiles, printer);
  });
}
