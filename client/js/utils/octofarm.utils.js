import { drawCamera } from "../templates/camera.template";

/**
 *
 * @param colour
 * @returns {{colourStyle: string, buttonStyle: string}}
 */
export function getNameColour(colour) {
  let colourStyle = `background-color: ${colour} !important;`;
  let buttonStyle = "btn-outline-dark";
  if (colour === "default") {
    colourStyle = "";
    buttonStyle = "btn-secondary";
  } else if (colour === "black") {
    buttonStyle = "btn-outline-light";
  }
  return {
    colourStyle,
    buttonStyle,
  };
}

/**
 *
 * @param otherSettings
 * @returns {{flipV: string, rotate90: string, flipH: string}}
 */
export function isRotated(otherSettings) {
  let flipH = "";
  let flipV = "";
  let rotate90 = "";

  if (!!otherSettings) {
    if (otherSettings.webCamSettings.flipH) {
      flipH = "rotateY(180deg)";
    }
    if (otherSettings.webCamSettings.flipV) {
      flipV = "rotateX(180deg)";
    }
    if (otherSettings.webCamSettings.rotate90) {
      rotate90 = "rotate(90deg)";
    }
  }
  return { flipH, flipV, rotate90 };
}

/**
 *
 * @param state
 * @param clientSettings
 * @returns {string}
 */
export function isHidden(state, clientSettings) {
  let hidden = "";
  if (state === "Offline" && clientSettings.views.showOffline) {
    hidden = "hidden";
  } else if (
    state === "Disconnected" &&
    clientSettings.views.showDisconnected
  ) {
    hidden = "hidden";
  }
  return hidden;
}

/**
 *
 * @param clientSettings
 * @returns {number|{default: number, type: Number | NumberConstructor, required: boolean}|*}
 */
export function checkPrinterRows(clientSettings) {
  if (clientSettings) {
    return clientSettings.views.cameraColumns;
  } else {
    return 2;
  }
}

/**
 *
 * @param clientSettings
 * @returns {number|{default: number, type: Number | NumberConstructor, required: boolean}|*}
 */
export function checkGroupColumns(clientSettings) {
  if (clientSettings) {
    return clientSettings.views.groupColumns;
  } else {
    return 2;
  }
}

/**
 *
 * @param printer
 * @param doNotDisplay
 * @returns {string}
 */
export function imageOrCamera(printer, doNotDisplay = false, modal = "") {
  if (doNotDisplay) {
    return "";
  }

  const flip = isRotated(printer.otherSettings);
  const { flipH, flipV, rotate90 } = flip;

  let hidden = false;

  //Is octoprints camera settings enabled?
  if (!!printer.otherSettings) {
    //Check if URL actually exists...
    if (printer.camURL !== "") {
      return drawCamera(printer._id, {
        url: printer.camURL,
        flipV,
        flipH,
        rotate90,
        aspectRatio: printer.aspectRatio,
        modal
      });
    } else {
      if (
        typeof printer.currentJob !== "undefined" &&
        printer.currentJob.thumbnail != null
      ) {
        return drawCamera(printer._id, {
          url: printer.printerURL + "/" + printer.currentJob.thumbnail,
          flipV,
          flipH,
          rotate90,
          aspectRatio: printer.aspectRatio,
          modal
        });
      } else {
        return drawCamera(printer._id, {
          url: "../images/noCamera.jpg",
          flipV,
          flipH,
          rotate90,
          aspectRatio: printer.aspectRatio,
          modal
        });
      }
    }
  } else {
    if (
      typeof printer.currentJob !== "undefined" &&
      printer.currentJob.thumbnail != null
    ) {
      return drawCamera(printer._id, {
        url: printer.printerURL + "/" + printer.currentJob.thumbnail,
        flipV,
        flipH,
        rotate90,
        aspectRatio: printer.aspectRatio,
        modal
      });
    } else {
      hidden = true;
      return drawCamera(printer._id, {
        url: "",
        flipV,
        flipH,
        rotate90,
        hidden,
        aspectRatio: printer.aspectRatio,
        modal
      });
    }
  }
}

/**
 *
 * @param printer
 * @returns {boolean}
 */
export function checkCameraState(printer) {
  //Is octoprints camera settings enabled?
  if (!!printer.otherSettings) {
    //Check if URL actually exists...
    if (printer.camURL !== "") {
      return true;
    } else {
      return (
        typeof printer.currentJob !== "undefined" &&
        printer.currentJob.thumbnail != null
      );
    }
  } else {
    return (
      typeof printer.currentJob !== "undefined" &&
      printer.currentJob.thumbnail != null
    );
  }
}

export function getPrinterCategory(printer) {
  const {
    printerState: {
      colour: { category },
    },
  } = printer;
  return category;
}

export function printerIsDisabled(printer) {
  const { disabled } = printer;

  return disabled;
}

export function printerIsOffline(printer) {
  const category = getPrinterCategory(printer);
  return category === "Offline";
}

export function printerIsSearching(printer) {
  const category = getPrinterCategory(printer);
  return category === "Info";
}

/**
 *
 * @param printer
 * @returns {boolean}
 */
export function printerIsOnline(printer) {
  if (printerIsDisabled(printer)) {
    return false;
  }
  if (!isPrinterFullyScanned(printer)) {
    return false;
  }
  if (printerIsSearching(printer)) {
    return false;
  }
  return !printerIsOffline(printer);
}

export function printerIsPrintingOrComplete(printer) {
  if (!printerIsOnline(printer)) {
    return false;
  }

  const category = getPrinterCategory(printer);

  return category === "Active" || category === "Complete";
}

export function printerIsPrinting(printer) {
  if (!printerIsOnline(printer)) {
    return false;
  }

  const category = getPrinterCategory(printer);

  return category === "Active";
}

export function isPrinterFullyScanned(printer) {
  const { fullyScanned } = printer;

  return fullyScanned;
}

export function printerIsAvailableToView(printer) {
  if (printerIsDisabled(printer)) {
    return false;
  }
  if (printerIsSearching(printer)) {
    return false;
  }
  return !!isPrinterFullyScanned(printer);
}
export function printerIsDisconnectedOrError(printer) {
  if (!printerIsOnline(printer)) {
    return false;
  }

  if (isPrinterDisconnected(printer)) {
    return true;
  }

  return isPrinterInErrorState(printer);
}

export function isPrinterDisconnected(printer) {
  if (!printerIsOnline(printer)) {
    return false;
  }

  const category = getPrinterCategory(printer);

  return category === "Disconnected";
}

export function isPrinterInErrorState(printer) {
  if (!printerIsOnline(printer)) {
    return false;
  }

  const category = getPrinterCategory(printer);

  return category.includes("Error") || category.includes("error");
}

export function printerIsIdle(printer) {
  if (!printerIsOnline(printer)) {
    return false;
  }

  const category = getPrinterCategory(printer);

  return category === "Idle" || category === "Complete";
}

export function closePrinterManagerModalIfOffline(printer) {
  if (!printerIsOnline(printer)) {
    $("#printerManagerModal").modal("hide");
  }
  return !printerIsOnline(printer);
}

export function closePrinterManagerModalIfDisconnected(printer) {
  if (isPrinterDisconnected(printer)) {
    $("#printerManagerModal").modal("hide");
  }
  return isPrinterDisconnected(printer);
}

export function canWeRestartOctoPrint(printer) {
  const { otherSettings: { commands: { serverRestartCommand } = {} } = {} } =
    printer || {};

  return !!serverRestartCommand || serverRestartCommand !== "";
}

export function canWeRestartOctoPrintHost(printer) {
  const { otherSettings: { commands: { systemRestartCommand } = {} } = {} } =
    printer || {};

  return !!systemRestartCommand || systemRestartCommand !== "";
}

export function canWeShutdownOctoPrintHost(printer) {
  const { otherSettings: { commands: { systemShutdownCommand } = {} } = {} } =
    printer || {};

  return !!systemShutdownCommand || systemShutdownCommand !== "";
}

export function canWeShutdownThePrinter(printer) {
  const { powerSettings: { powerOffCommand } = {} } = printer || {};

  return !!powerOffCommand || powerOffCommand !== "";
}

export function canWeTurnOnThePrinter(printer) {
  const { powerSettings: { powerOnCommand } = {} } = printer || {};

  return !!powerOnCommand || powerOnCommand !== "";
}

export function canWeTurnOffThePrinter(printer) {
  const { powerSettings: { powerOffCommand } = {} } = printer || {};

  return !!powerOffCommand || powerOffCommand !== "";
}

export function canWeDetectPrintersPowerState(powerStatusURL) {
  return !!powerStatusURL || powerStatusURL.length === 0;
}
