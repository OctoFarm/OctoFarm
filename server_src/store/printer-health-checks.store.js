const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const {
  printerChecks,
  apiChecks,
  websocketChecks,
  printerConnectionCheck,
  profileChecks,
  webcamChecks,
  checkConnectionsMatchRetrySettings
} = require("../services/printer-health-checks.service");
let printerHealthChecks = [];

const returnPrinterHealthChecks = (force = false) => {
  if (force) {
    updatePrinterHealthChecks().then();
  }
  return printerHealthChecks;
};

const updatePrinterHealthChecks = async () => {
  const farmPrinters = getPrinterStoreCache().listPrintersInformation();
  printerHealthChecks = [];
  for (let i = 0; i < farmPrinters.length; i++) {
    const currentURL = new URL(farmPrinters[i].printerURL);

    const printerCheck = {
      printerName: farmPrinters[i].printerName,
      printerChecks: printerChecks(farmPrinters[i]),
      apiChecks: apiChecks(farmPrinters[i].systemChecks.scanning),
      websocketChecks: websocketChecks(currentURL.host),
      connectionChecks: printerConnectionCheck(
        farmPrinters[i].currentConnection,
        farmPrinters[i].connectionOptions
      ),
      profileChecks: profileChecks(farmPrinters[i].currentProfile),
      webcamChecks: webcamChecks(
        farmPrinters[i].cameraURL,
        farmPrinters[i]?.otherSettings?.webCamSettings
      ),
      connectionIssues: checkConnectionsMatchRetrySettings(currentURL.host)
    };
    printerHealthChecks.push(printerCheck);
  }
  return printerHealthChecks;
};

module.exports = {
  returnPrinterHealthChecks,
  updatePrinterHealthChecks
};
