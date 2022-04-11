const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const {
  printerChecks,
  apiChecksRequired,
  apiChecksOptional,
  websocketChecks,
  printerConnectionCheck,
  profileChecks,
  webcamChecks,
  checkConnectionsMatchRetrySettings
} = require("../services/printer-health-checks.service");
const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-HealthChecks");

let printerHealthChecks = [];

/**
 * Returns the current printer health checks, pass a boolean to force the health check.
 * @param {Boolean} force
 * @returns {*[]}
 */
const returnPrinterHealthChecks = (force = false) => {
  if (force) {
    logger.info("Running printer health check.", { force });
    updatePrinterHealthChecks().then();
  }
  return printerHealthChecks;
};

const updatePrinterHealthChecks = async () => {
  const farmPrinters = getPrinterStoreCache().listPrintersInformation();
  printerHealthChecks = [];
  logger.warning(`Found ${farmPrinters.length} to health check.`);
  for (const printer of farmPrinters) {
    if (printer.printerState.colour.category !== "Offline") {
      logger.debug("Checking printer", { printer: printer.printerURL });
      const currentURL = new URL(printer.printerURL);

      const printerCheck = {
        dateChecked: new Date(),
        printerName: printer.printerName,
        printerID: printer._id,
        printerChecks: printerChecks(printer),
        apiChecksRequired: apiChecksRequired(printer.systemChecks.scanning),
        apiChecksOptional: apiChecksOptional(printer.systemChecks.scanning),
        websocketChecks: websocketChecks(currentURL.host),
        connectionChecks: printerConnectionCheck(
          printer.currentConnection,
          printer.connectionOptions
        ),
        profileChecks: profileChecks(printer.currentProfile),
        webcamChecks: webcamChecks(printer.camURL, printer?.otherSettings?.webCamSettings),
        connectionIssues: checkConnectionsMatchRetrySettings(currentURL.host)
      };
      logger.debug("Printer checked", { printer: printer.printerURL });
      checkAndUpdatePrinterFlag(printer._id, printerCheck);

      printerHealthChecks.push(printerCheck);
    }
  }

  return printerHealthChecks;
};

const checkAndUpdatePrinterFlag = (id, checks) => {
  let healthChecksPass = true;

  const { printerURL, webSocketURL, cameraURL, match } = checks.printerChecks;

  if (!printerURL || !webSocketURL || !cameraURL || !match) healthChecksPass = false;

  const { userCheck, stateCheck, profileCheck, settingsCheck, systemCheck } =
    checks.apiChecksRequired;

  if (!userCheck || !stateCheck || !profileCheck || !settingsCheck || !systemCheck)
    healthChecksPass = false;

  const { totalPingPong } = checks.websocketChecks;

  if (totalPingPong > 5) healthChecksPass = false;

  const { baud, port, profile } = checks.connectionChecks;

  if (!baud || !port || !profile) healthChecksPass = false;

  const { camSetup, historySetup } = checks.webcamChecks;

  if (!camSetup) healthChecksPass = false;

  const { ffmpegPath, ffmpegVideoCodex, timelapseEnabled } = historySetup;
  if (!ffmpegPath || !ffmpegVideoCodex || !timelapseEnabled) healthChecksPass = false;

  const { apiResponses } = checks.connectionIssues;

  const log_throttle = {};
  const log_timeout = {};

  apiResponses.forEach((res) => {
    if (!res.initialTimeout) healthChecksPass = false;
  });

  logger.debug("Results: ", {
    printer: { printerURL, webSocketURL, cameraURL, match },
    api_required: { userCheck, stateCheck, profileCheck, settingsCheck, systemCheck },
    ping_pong: { totalPingPong },
    connection_check: { baud, port, profile },
    cam_setup: { camSetup },
    history_setup: { ffmpegPath, ffmpegVideoCodex, timelapseEnabled },
    log_throttle,
    log_timeout
  });

  getPrinterStoreCache().updatePrinterLiveValue(id, {
    healthChecksPass: healthChecksPass
  });
};

module.exports = {
  returnPrinterHealthChecks,
  updatePrinterHealthChecks
};
