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
  for (let i = 0; i < farmPrinters.length; i++) {
    if (farmPrinters[i].printerState.colour.category !== "Offline") {
      logger.debug("Checking printer", { printer: farmPrinters[i].printerURL });
      const currentURL = new URL(farmPrinters[i].printerURL);

      const printerCheck = {
        dateChecked: new Date(),
        printerName: farmPrinters[i].printerName,
        printerID: farmPrinters[i]._id,
        printerChecks: printerChecks(farmPrinters[i]),
        apiChecksRequired: apiChecksRequired(farmPrinters[i].systemChecks.scanning),
        apiChecksOptional: apiChecksOptional(farmPrinters[i].systemChecks.scanning),
        websocketChecks: websocketChecks(currentURL.host),
        connectionChecks: printerConnectionCheck(
          farmPrinters[i].currentConnection,
          farmPrinters[i].connectionOptions
        ),
        profileChecks: profileChecks(farmPrinters[i].currentProfile),
        webcamChecks: webcamChecks(
          farmPrinters[i].camURL,
          farmPrinters[i]?.otherSettings?.webCamSettings
        ),
        connectionIssues: checkConnectionsMatchRetrySettings(currentURL.host)
      };
      logger.debug("Printer checked", { printer: farmPrinters[i].printerURL });
      checkAndUpdatePrinterFlag(farmPrinters[i]._id, printerCheck);

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
  const log_cutoff = {};

  apiResponses.forEach((res) => {
    log_timeout[res.url] = { cutOffTimeout: !!res.cutOffTimeout };
    log_cutoff[res.url] = { cutOffTimeout: !!res.cutOffTimeout };
    if (!res.initialTimeout || !res.cutOffTimeout) healthChecksPass = false;
  });

  logger.debug("Results: ", {
    printer: { printerURL, webSocketURL, cameraURL, match },
    api_required: { userCheck, stateCheck, profileCheck, settingsCheck, systemCheck },
    ping_pong: { totalPingPong },
    connection_check: { baud, port, profile },
    cam_setup: { camSetup },
    history_setup: { ffmpegPath, ffmpegVideoCodex, timelapseEnabled },
    log_throttle,
    log_timeout,
    log_cutoff
  });

  getPrinterStoreCache().updatePrinterLiveValue(id, {
    healthChecksPass: healthChecksPass
  });
};

module.exports = {
  returnPrinterHealthChecks,
  updatePrinterHealthChecks
};
