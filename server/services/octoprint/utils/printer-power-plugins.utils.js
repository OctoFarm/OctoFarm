const parseOctoPrintPowerResponse = (response) => {
  let powerStatus = false;

  if (!!response) {
    powerStatus = response[Object.keys(response)[0]];
    // Patches for string based state response tasmota/tplink plugins

    if (typeof powerStatus === "string") {
      if (powerStatus === "off") {
        powerStatus = false;
      }

      if (powerStatus === "on") {
        powerStatus = true;
      }
    }
  }

  return powerStatus;
};

const createPrinterPowerURL = (url, apikey, printerURL) => {
  if (url.includes("[PrinterURL]")) {
    url = url.replace("[PrinterURL]", "");
  }
  if (url.includes("[PrinterAPI]")) {
    url = url.replace("[PrinterAPI]", apikey);
  }
  if (url.includes(printerURL)) {
    url = url.replace(printerURL, "");
  }

  return url;
};

const canWeDetectPrintersPowerState = (powerStatusURL) => {
  return !!powerStatusURL && powerStatusURL.length !== 0;
};


module.exports = {
  parseOctoPrintPowerResponse,
  createPrinterPowerURL,
  canWeDetectPrintersPowerState
};
