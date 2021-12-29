const { getPrinterStoreCache } = require("../../../cache/printer-store.cache");
const Logger = require("../../../handlers/logger");
const { PrinterTicker } = require("../../../runners/printerTicker");
const { SystemRunner } = require("../../../runners/systemInfo");
const { AppConstants } = require("../../../app.constants");
const { ScriptRunner } = require("../../../runners/scriptCheck");
const { clonePayloadDataForHistory } = require("../../../utils/mapping.utils");
const { HistoryCollection } = require("../../../runners/history.runner.js");

const logger = new Logger("OctoFarm-State");

const tickerWrapper = (id, state, message) => {
  PrinterTicker.addIssue(new Date(), getPrinterStoreCache().getPrinterURL(id), message, state, id);
};

const captureClientAuthed = (id, data) => {
  let { networkIpAddresses } = SystemRunner.returnInfo();
  if (!networkIpAddresses) networkIpAddresses = [];
  const { remoteAddress, username } = data;

  let detectedAddress = "Socked Authed for: ";

  if (networkIpAddresses.includes(remoteAddress)) {
    detectedAddress += process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY];
  } else if (!!remoteAddress) {
    detectedAddress += remoteAddress;
  } else {
    detectedAddress += "Unknown IP";
  }

  const currentUser = getPrinterStoreCache().getCurrentUser(id);
  let detectedUser = "";

  switch (currentUser) {
    case username:
      detectedUser += username;
      break;
    case null:
      detectedUser += "A pesky ghost (Don't know who)";
      break;
    default:
      detectedUser += currentUser;
  }
  const message = `${detectedAddress} with user: ${detectedUser}`;
  logger.warning(message);
  tickerWrapper(id, "Complete", message);
};
const captureClientClosed = (id, data) => {
  let { networkIpAddresses } = SystemRunner.returnInfo();

  if (!networkIpAddresses) networkIpAddresses = [];
  const { remoteAddress } = data;

  let detectedAddress = "Socket was closed for: ";
  if (networkIpAddresses.includes(remoteAddress)) {
    detectedAddress += process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY];
  } else if (!!remoteAddress) {
    detectedAddress += remoteAddress;
  } else {
    detectedAddress += "Unknown IP";
  }
  logger.warning(detectedAddress);
  tickerWrapper(id, "Info", detectedAddress);
};
const captureClientOpened = (id, data) => {
  let { networkIpAddresses } = SystemRunner.returnInfo();
  if (!networkIpAddresses) networkIpAddresses = [];

  const { remoteAddress } = data;

  let detectedAddress = "Socket Opened for: ";
  if (networkIpAddresses.includes(remoteAddress)) {
    detectedAddress += process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY];
  } else if (!!remoteAddress) {
    detectedAddress += remoteAddress;
  } else {
    detectedAddress += "Unknown IP";
  }
  logger.warning(detectedAddress);
  tickerWrapper(id, "Info", detectedAddress);
};
const captureConnected = (id, data) => {};
const captureDisconnecting = (id, data) => {};
const captureDisconnected = (id, data) => {};
const captureDwelling = (id, data) => {};
const captureError = (id, data) => {
  const { payloadData, printer, job, files, resendStats } = clonePayloadDataForHistory(
    data,
    getPrinterStoreCache().getPrinter(id)
  );

  // Register cancelled print...
  HistoryCollection.errorLog(payloadData, printer, job, files, resendStats)
    .then((res) => {
      logger.info("Successfully captured error", res);
      setTimeout(async function () {
        // Register cancelled print...

        // await Runner.updateFilament();
        // TODO Update Printer Manager call to update filament... or maybe register as a task and call

        setTimeout(async function () {
          // TODO This is something that can be fired from the store...
          // await Runner.reSyncFile(
          //   farmPrinters[that.index]._id,
          //   farmPrinters[that.index].job.file.path
          // );
        }, 5000);
      }, 10000);
    })
    .catch((e) => {
      logger.error("Failed to capture error", e);
    });
};
const captureFileAdded = (id, data) => {};
const captureFileDeselected = (id, data) => {};
const captureFileRemoved = (id, data) => {};
const captureFirmwareData = (id, data) => {
  const { name } = data;
  logger.warning("Updating printer firmware version", name);
  getPrinterStoreCache().updatePrinterDatabase(id, {
    printerFirmware: name
  });
};
const captureFolderAdded = (id, data) => {};
const captureFolderRemoved = (id, data) => {};
const captureHome = (id, data) => {};
const captureMetadataAnalysisFinished = (id, data) => {};
const captureMetadataAnalysisStarted = (id, data) => {};
const captureMetadataStatisticsUpdated = (id, data) => {};
const capturePositionUpdate = (id, data) => {};
const capturePrintCancelled = (id, data) => {};
const capturePrintCancelling = (id, data) => {};
const captureFinishedPrint = (id, data, success) => {
  const { payloadData, printer, job, files, resendStats } = clonePayloadDataForHistory(
    data,
    getPrinterStoreCache().getPrinter(id)
  );
  HistoryCollection.capturePrint(payloadData, printer, job, files, resendStats, success)
    .then((res) => {
      logger.info("Successfully captured print!", res);

      setTimeout(async function () {
        // Register cancelled print...

        // await Runner.updateFilament();
        // TODO Update Printer Manager call to update filament... or maybe register as a task and call

        setTimeout(async function () {
          // TODO This is something that can be fired from the store...
          // await Runner.reSyncFile(
          //   farmPrinters[that.index]._id,
          //   farmPrinters[that.index].job.file.path
          // );
        }, 5000);
      }, 10000);
    })
    .catch((e) => {
      logger.error("Failed to capture print!", e);
    });
};
const capturePrintPaused = (id) => {
  ScriptRunner.check(getPrinterStoreCache().getPrinter(id), "paused", undefined)
    .then((res) => {
      logger.info("Successfully checked paused script", res);
      return res;
    })
    .catch((e) => {
      logger.error("Failed to check paused script", e);
    });
};
const capturePrintStarted = (id, data) => {};
const capturePrinterStateChanged = (id, data) => {};
const captureTransferDone = (id, data) => {};
const captureTransferStarted = (id, data) => {};
const captureUpdatedFiles = (id, data) => {};
const captureUpload = (id, data) => {};
const captureUserLoggedOut = (id, data) => {
  const currentUser = getPrinterStoreCache().getCurrentUser(id);
  let detectedUser = "User: ";
  const hasLoggedOut = " has logged out of OctoPrint.";

  switch (currentUser) {
    case data.username:
      detectedUser += data.username;
      break;
    case null:
      detectedUser += "A pesky ghost (Don't know who)";
      break;
    default:
      detectedUser += currentUser;
  }
  logger.warning(detectedUser + hasLoggedOut);
  tickerWrapper(id, "Info", detectedUser + hasLoggedOut);
};
const captureUserLoggedIn = (id, data) => {
  const currentUser = getPrinterStoreCache().getCurrentUser(id);
  let detectedUser = "User: ";
  const hasLoggedIn = " has logged in to OctoPrint.";

  switch (currentUser) {
    case data.username:
      detectedUser += data.username;
      break;
    case null:
      detectedUser += "A pesky ghost (Don't know who)";
      break;
    default:
      detectedUser += currentUser;
  }
  logger.warning(detectedUser + hasLoggedIn);
  tickerWrapper(id, "Info", detectedUser + hasLoggedIn);
};
const captureZChange = (id, data) => {};

module.exports = {
  captureClientAuthed,
  captureClientClosed,
  captureClientOpened,
  captureConnected,
  captureDisconnecting,
  captureDisconnected,
  captureDwelling,
  captureError,
  captureFileAdded,
  captureFileDeselected,
  captureFileRemoved,
  captureFirmwareData,
  captureFolderAdded,
  captureFolderRemoved,
  captureHome,
  captureMetadataAnalysisFinished,
  captureMetadataAnalysisStarted,
  captureMetadataStatisticsUpdated,
  capturePositionUpdate,
  capturePrintCancelled,
  capturePrintCancelling,
  captureFinishedPrint,
  capturePrintPaused,
  capturePrintStarted,
  capturePrinterStateChanged,
  captureTransferDone,
  captureTransferStarted,
  captureUpdatedFiles,
  captureUpload,
  captureUserLoggedIn,
  captureUserLoggedOut,
  captureZChange
};
