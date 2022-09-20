const { findIndex } = require('lodash');
const fetch = require('node-fetch');
const fs = require('fs');
const History = require('../models/History.js');
const Logger = require('../handlers/logger.js');
const { SettingsClean } = require('./settings-cleaner.service');
const Spool = require('../models/Filament.js');
const MjpegDecoder = require('mjpeg-decoder');
const { downloadImage, downloadFromOctoPrint } = require('../utils/download.util');
const { getHistoryCache } = require('../cache/history.cache');
const { DEFAULT_SPOOL_DENSITY, DEFAULT_SPOOL_RATIO } = require('../constants/cleaner.constants');
const { OctoprintApiClientService } = require('./octoprint/octoprint-api-client.service');
const { clonePayloadDataForHistory } = require('../utils/mapping.utils');
const { sleep } = require('../utils/promise.utils');
const { getPrinterStoreCache } = require('../cache/printer-store.cache');
const { getInfluxCleanerCache } = require('../cache/influx-export.cache');
const { LOGGER_ROUTE_KEYS } = require('../constants/logger.constants');
const { FilamentClean } = require('../services/filament-cleaner.service');

const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_HISTORY_CAPTURE);

const routeBase = '../images/historyCollection';
const PATHS = {
  base: routeBase,
  thumbnails: routeBase + '/thumbs',
  snapshots: routeBase + '/snapshots',
  timelapses: routeBase + '/timelapses',
};

/**
 * Make a specific historyCollection folder if not created yet
 */
function ensureFolderExists(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
}

/**
 * Make the historyCollection root folder if not created yet
 */
function ensureBaseFolderExists() {
  ensureFolderExists(PATHS.base);
}

class HistoryCaptureService {
  // Record Data
  #printerName = null;
  #printerID = null;
  #activeControlUser = null;
  #printerGroup = null;
  #costSettings = null;
  #success = null;
  #reason = null;
  #fileName = null;
  #filePath = null;
  #startDate = null;
  #endDate = null;
  #printTime = null;
  #filamentSelection = null;
  #job = null;
  #notes = '';
  #snapshot = '';
  #timelapse = '';
  #thumbnail = '';
  #resends = null;
  #maxTimerCheck = 1000 * 3600; // One Hour Timer
  #currentTimerCheck = 0;

  // Additional fields from constructor, required in filament/snapshot/timelapse/thumbnail calls.
  #historyRecordID = null;
  #printerAPIConnector = null;
  #printerURL = null;
  #apikey = null;
  #timeout = null;
  #selectedFilament = null;
  #payload = null;
  #files = null;
  #camURL = null;

  constructor(eventPayload, capturedPrinterData, state) {
    const { payloadData, printer, job, files, resendStats, activeControlUser } =
      clonePayloadDataForHistory(eventPayload, capturedPrinterData);

    this.#printerName = printer.printerName;
    this.#printerID = printer._id;
    this.#printerGroup = printer.group;
    this.#costSettings = printer.costSettings;
    this.#success = state;
    this.#reason = eventPayload.reason;
    this.#fileName = eventPayload.name;
    this.#filePath = eventPayload.path;
    this.#activeControlUser = activeControlUser;

    const { startDate, endDate } = this.generateStartEndDates(payloadData);
    this.#startDate = startDate;
    this.#endDate = endDate;
    this.#printTime = Math.round(payloadData.time);
    this.#job = job;
    this.#resends = resendStats;
    this.#printerURL = printer.printerURL;
    this.#apikey = printer.apikey;
    this.#timeout = printer.timeout;
    this.#filamentSelection = printer.selectedFilament;
    this.#payload = payloadData;
    this.#files = files;
    this.#camURL = printer.camURL;
    this.#selectedFilament = printer.selectedFilament;

    this.#printerAPIConnector = new OctoprintApiClientService(
      printer.printerURL,
      printer.apikey,
      printer.timeout
    );
  }

  async createHistoryRecord() {
    // Save the initial history record with constucted values...
    const printHistory = {
      printerName: this.#printerName,
      printerID: this.#printerID,
      printerGroup: this.#printerGroup,
      costSettings: this.#costSettings,
      success: this.#success,
      reason: this.#reason,
      fileName: this.#fileName,
      filePath: this.#filePath,
      startDate: this.#startDate,
      endDate: this.#endDate,
      printTime: this.#printTime,
      filamentSelection: this.#filamentSelection,
      job: this.#job,
      notes: this.#notes,
      snapshot: this.#snapshot,
      timelapse: this.#timelapse,
      thumbnail: this.#thumbnail,
      resends: this.#resends,
      activeControlUser: this.#activeControlUser,
    };

    logger.warning(
      `${this.#success ? 'Completed' : 'Failed'} Print triggered - ${JSON.stringify(printHistory)}`
    );

    // Create our history object
    const saveHistory = new History({
      printHistory,
    });

    this.#historyRecordID = saveHistory._id.toString();
    // Save the initial value of the record...
    await saveHistory.save().catch((e) => {
      logger.error('Unable to save the history record to database...', e);
      return e;
    });

    const serverSettingsCache = SettingsClean.returnSystemSettings();

    // Save initial history
    if (this.#success) {
      this.checkForAdditionalSuccessProperties().catch((e) => {
        logger.error("Couldn't check for additional success properties", e.toString());
      });
    }
    if (!this.#success) {
      this.checkForAdditionalFailureProperties().catch((e) => {
        logger.error("Couldn't check for additional failed properties", e.toString());
      });
    }

    await sleep(5000);
    // Re-generate history cache...
    try {
      await getHistoryCache().initCache();
    } catch (e) {
      logger.error('Unable to generate history cache!', e.toString());
    }
    try {
      await getInfluxCleanerCache().cleanAndWriteFinishedPrintInformationForInflux(saveHistory, {
        printerName: this.#printerName,
        printerID: this.#printerID,
        printerGroup: this.#printerGroup,
      });
    } catch (e) {
      logger.error('Unable to send finished print data to influx!', e.toString());
    }

    if (
      !serverSettingsCache.filament.downDateFailed ||
      !serverSettingsCache.filament.downDateSuccess
    ) {
      try {
        this.#selectedFilament.forEach((spool) => {
          getInfluxCleanerCache().cleanAndWriteMaterialsInformationForInflux(
            spool,
            {
              printerName: this.#printerName,
              printerID: this.#printerID,
              printerGroup: this.#printerGroup,
            },
            {
              printerName: this.#printerName,
              printerID: this.#printerID,
              printerGroup: this.#printerGroup,
              costSettings: this.#costSettings,
              success: this.#success,
              reason: this.#reason,
              fileName: this.#fileName,
              filePath: this.#filePath,
              startDate: this.#startDate,
              endDate: this.#endDate,
              printTime: this.#printTime,
              filamentSelection: this.#filamentSelection,
              job: this.#job,
              notes: this.#notes,
              snapshot: this.#snapshot,
              timelapse: this.#timelapse,
              thumbnail: this.#thumbnail,
              resends: this.#resends,
              activeControlUser: this.#activeControlUser,
            },
            0
          );
        });
      } catch (e) {
        logger.error('Unable to update spool information to influx!', e.toString());
      }
    }

    return {
      saveHistory,
    };
  }

  async grabThumbnail(url, thumbnail) {
    if (!url && !thumbnail) {
      logger.error('Unable to download thumbnail! No URL or thumbnail provided', {
        url,
        thumbnail,
      });
      return '';
    }
    const thumbParts = thumbnail.split('/');
    const result = thumbParts[thumbParts.length - 1];
    const splitAgain = result.split('?');
    const filePath = `${PATHS.thumbnails}/${this.#historyRecordID}-${splitAgain[0]}`;

    ensureBaseFolderExists();
    ensureFolderExists(PATHS.thumbnails);

    await downloadImage(url, filePath, this.#apikey, () => {
      logger.info('Thumbnail downloaded from: ', { url });
      logger.info('Thumbnail saved as: ', { filePath });
    });

    return filePath;
  }

  async snapPictureOfPrinter() {
    if (!this.#camURL && this.#camURL === '') {
      logger.error("Unable to snap picture from camera, url doesn't exist!", {
        cameraURL: this.#camURL,
      });
      return '';
    }
    ensureBaseFolderExists();
    ensureFolderExists(PATHS.snapshots);
    const decoder = MjpegDecoder.decoderForSnapshot(this.#camURL);
    const frame = await decoder.takeSnapshot();
    const filePath = `${PATHS.snapshots}/${this.#historyRecordID}-${this.#fileName}.jpg`;
    await fs.writeFileSync(filePath, frame);
    logger.info('Snapshot downloaded as: ', this.#camURL);
    logger.info('Snapshot saved as: ', filePath);
    return filePath;
  }

  async thumbnailCheck() {
    try {
      let runCapture = async () => {
        // grab Thumbnail if available.
        const currentFileIndex = findIndex(this.#files, (o) => {
          return o.name === this.#payload.name;
        });
        let base64Thumbnail = null;
        if (currentFileIndex > -1) {
          if (
            typeof this.#files[currentFileIndex] !== 'undefined' &&
            this.#files[currentFileIndex].thumbnail !== null
          ) {
            base64Thumbnail = await this.grabThumbnail(
              `${this.#printerURL}/${this.#files[currentFileIndex].thumbnail}`,
              this.#files[currentFileIndex].thumbnail
            );
          }
        }
        return base64Thumbnail;
      };

      return runCapture();
    } catch (e) {
      logger.error("Couldn't capture thumbnail as requested!", e);
    }
  }

  async snapshotCheck() {
    // Use default settings if not present
    try {
      return this.snapPictureOfPrinter();
    } catch (e) {
      logger.error("Couldn't capture webcam snapshot as requested!", e);
    }
  }

  increaseTimelapseCheckTimer(ms) {
    //only increase the timeout if printer is ! active. OctoPrint pauses the timelapse generation when it's printing...
    if (!getPrinterStoreCache().isPrinterActive(this.#printerID)) {
      this.#currentTimerCheck = this.#currentTimerCheck + ms;
    }
  }

  async timelapseCheck() {
    if (this.#payload?.time <= 10) {
      logger.warning('Print time too short, skipping timelapse grab...', {
        time: this.#payload?.time,
      });
      return '';
    }

    if (this.#currentTimerCheck >= this.#maxTimerCheck) {
      logger.warning('Timelapse check did not find an timelapse within an our... bailing out!', {
        currentTimerCheck: this.#currentTimerCheck,
        maxTimerCheck: this.#maxTimerCheck,
      });
      return '';
    }

    const timeLapseCall = await this.#printerAPIConnector.getTimelapses(true);

    if (!timeLapseCall.ok) {
      logger.error('Time lapse call failed to contact OctoPrint... skipping timelapse grab...', {
        timeLapseCall,
      });
      return '';
    }

    logger.info('Checking for timelapse...', this.#fileName);

    const timelapseResponse = await timeLapseCall.json();

    logger.debug('Timelapse call: ', timelapseResponse);

    //Give time for OP to start generating the file...
    await sleep(5000);
    this.increaseTimelapseCheckTimer(5000);

    const { unrendered, files } = timelapseResponse;

    if (unrendered.length === 0 && files.length === 0) {
      logger.warning('OctoPrint has no timelapses rendering or listed in files...', {
        unrendered,
        files,
      });
      return '';
    }

    //is it unrendered?
    let cleanFileName = JSON.parse(JSON.stringify(this.#fileName));
    if (this.#fileName.includes('.gcode')) {
      cleanFileName = cleanFileName.replace('.gcode', '');
    }
    const unrenderedTimelapseIndex = unrendered.findIndex((o) => o.name.includes(cleanFileName));

    //if unrendered check timelapse again...
    logger.debug('Unrendered Index: ', {
      unrenderedTimelapseIndex,
      unrenderedList: unrendered,
    });
    if (unrenderedTimelapseIndex > -1) {
      logger.warning('Timelapse not rendered yet... re-checking... in 10000ms', {
        unrenderedTimelapseIndex,
      });
      //Give time for OP to finish generating the file...
      await sleep(10000);
      this.increaseTimelapseCheckTimer(10000);
      await this.timelapseCheck();
    }

    //Give more time for OP to move the file from unrendered to files list
    await sleep(10000);
    this.increaseTimelapseCheckTimer(10000);

    const lastTimelapseMatchedIndexArray = files.filter((item) =>
      item.name.includes(cleanFileName)
    );

    const timeDifferencesList = [];

    for (const [i, timelapse] of lastTimelapseMatchedIndexArray.entries()) {
      logger.debug('Checked times', { octoFarm: this.#endDate, octoprint: timelapse.date });
      timeDifferencesList[i] = Math.abs(this.#endDate - new Date(timelapse.date));
    }

    const smallestNumberInTimeDifferences = Math.min(...timeDifferencesList);
    const indexOfTimelapse = timeDifferencesList.indexOf(smallestNumberInTimeDifferences);

    logger.debug('rendered Index: ', {
      indexOfTimelapse,
      renderedList: lastTimelapseMatchedIndexArray,
    });
    if (indexOfTimelapse > -1) {
      return this.grabTimeLapse(
        lastTimelapseMatchedIndexArray[indexOfTimelapse].name,
        this.#printerURL + lastTimelapseMatchedIndexArray[indexOfTimelapse].url
      );
    }

    logger.error('Unable to determine correct timelapse file to download... skipped! ', {
      timelapseFiles: lastTimelapseMatchedIndexArray,
      cleanFileName,
    });

    return '';
  }

  async grabTimeLapse(fileName, url) {
    ensureBaseFolderExists();
    ensureFolderExists(PATHS.timelapses);

    const filePath = `${PATHS.timelapses}/${this.#historyRecordID}-${fileName}`;

    await downloadFromOctoPrint(url, filePath, this.#apikey, async () => {
      const serverSettingsCache = SettingsClean.returnSystemSettings();
      if (serverSettingsCache?.history?.timelapse?.deleteAfter) {
        await sleep(30000);
        logger.info('Deleting time lapse from OctoPrint...', { url, filePath });
        await this.deleteTimeLapse(fileName);
        logger.info('Deleted timelapse from OctoPrint', { fileName });
      }
    });

    logger.info('Downloaded timelapse from: ', { url });
    logger.info('Saved timelapse to: ', { filePath });
    await History.findByIdAndUpdate(this.#historyRecordID, {
      $set: { 'printHistory.timelapse': filePath },
    })
      .then(async () => {
        await getHistoryCache().initCache();
      })
      .catch((e) => {
        logger.error('Unable to update history timelapse record: ', e.toString());
      });

    return filePath;
  }

  async deleteTimeLapse(fileName) {
    return fetch(`${this.#printerURL}/api/timelapse/${fileName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.#apikey,
      },
    });
  }

  generateStartEndDates(payload) {
    const today = new Date();
    const printTime = new Date(payload.time * 1000);
    let startDate = today.getTime() - printTime.getTime();
    startDate = new Date(startDate);

    const endDate = new Date();
    return { startDate, endDate };
  }

  // repeated... could have imported I suppose...
  generateWeightOfJobForASpool(length, filament, completionRatio) {
    if (!length) {
      return length === 0 ? 0 : length;
    }

    let density = DEFAULT_SPOOL_DENSITY;
    let radius = DEFAULT_SPOOL_RATIO;
    if (!!filament?.spools?.profile) {
      radius = parseFloat(filament.spools.profile.diameter) / 2;
      density = parseFloat(filament.spools.profile.density);
    }

    const volume = length * Math.PI * radius * radius; // Repeated 4x across server
    return completionRatio * volume * density;
  }

  async downDateWeight() {
    // Complete guess at a heat up time... deffo no filament used by this time, or very unimportant amounts.
    if (!this.#success && this.#payload.time < 60) {
      logger.warning('Not downdating failed print as shorter than 1 minute...');
      return;
    }

    let printTime = 0;
    if (this.#job?.lastPrintTime) {
      // Last print time available, use this as it's more accurate
      printTime = this.#job.lastPrintTime;
    } else {
      printTime = this.#job.estimatedPrintTime;
    }

    let printPercentage = 0;

    if (!this.#success) {
      printPercentage = (this.#payload.time / printTime) * 100;
    }

    let completionRatio = this.#success ? 1.0 : printPercentage / 100;

    for (let s = 0; s < this.#filamentSelection.length; s++) {
      const currentSpool = this.#filamentSelection[s];
      if (!!currentSpool || this.#job?.filament['tool' + s]) {
        const currentGram = this.generateWeightOfJobForASpool(
          this.#job.filament['tool' + s].length / 1000,
          currentSpool,
          completionRatio
        );
        await Spool.findById(currentSpool._id)
          .then((spool) => {
            const currentUsed = parseFloat(spool.spools.used);
            logger.warning('Previous spool amount', currentUsed);
            spool.spools.used = currentUsed + parseFloat(currentGram);
            logger.warning('New spool amount', spool.spools.used);
            spool.markModified('spools.used');
            spool
              .save()
              .then((res) => {
                logger.info('Successfully downdated spool data!', res);
              })
              .catch((e) => {
                logger.error('Unable to update spool data!', e);
              });
            currentSpool.spools.used = currentUsed + parseFloat(currentGram);
            getInfluxCleanerCache().cleanAndWriteMaterialsInformationForInflux(
              currentSpool,
              {
                printerName: this.#printerName,
                printerID: this.#printerID,
                printerGroup: this.#printerGroup,
              },
              {
                printerName: this.#printerName,
                printerID: this.#printerID,
                printerGroup: this.#printerGroup,
                costSettings: this.#costSettings,
                success: this.#success,
                reason: this.#reason,
                fileName: this.#fileName,
                filePath: this.#filePath,
                startDate: this.#startDate,
                endDate: this.#endDate,
                printTime: this.#printTime,
                filamentSelection: this.#filamentSelection,
                job: this.#job,
                notes: this.#notes,
                snapshot: this.#snapshot,
                timelapse: this.#timelapse,
                thumbnail: this.#thumbnail,
                resends: this.#resends,
                activeControlUser: this.#activeControlUser,
              },
              currentGram
            );
          })
          .finally(async () => {
            await FilamentClean.start();
          });
      } else {
        logger.error('Unable to downdate spool weight, non selected...');
      }
    }
  }

  async checkForAdditionalSuccessProperties() {
    const serverSettingsCache = SettingsClean.returnSystemSettings();

    if (serverSettingsCache.filament.downDateSuccess) {
      // Capture success amount
      await this.downDateWeight();
    }

    if (serverSettingsCache.history.thumbnails.onComplete) {
      this.#thumbnail = await this.thumbnailCheck();
      await History.findByIdAndUpdate(this.#historyRecordID, {
        $set: { 'printHistory.thumbnail': this.#thumbnail },
      })
        .then(async () => {
          await getHistoryCache().initCache();
        })
        .catch((e) => {
          logger.error('Unable to update history filament record: ', e.toString());
        });
    }

    if (serverSettingsCache.history.snapshot.onComplete) {
      this.#snapshot = await this.snapshotCheck();
      await History.findByIdAndUpdate(this.#historyRecordID, {
        $set: { 'printHistory.snapshot': this.#snapshot },
      })
        .then(async () => {
          await getHistoryCache().initCache();
        })
        .catch((e) => {
          logger.error('Unable to update history filament record: ', e.toString());
        });
    }

    if (serverSettingsCache.history.timelapse.onComplete) {
      await this.timelapseCheck();
    }
  }

  async checkForAdditionalFailureProperties() {
    const serverSettingsCache = SettingsClean.returnSystemSettings();

    if (serverSettingsCache.filament.downDateFailed) {
      // No point even trying to down date failed without these...
      if (!this.#job?.estimatedPrintTime && !this.#job?.lastPrintTime) {
        logger.error(
          'Unable to downdate failed jobs spool, no estimatedPrintTime or lastPrintTime',
          this.#job
        );
        return;
      }
      // Capture failed amount
      await this.downDateWeight();
    }

    if (serverSettingsCache.history.thumbnails.onFailure) {
      this.#thumbnail = await this.thumbnailCheck();
      await History.findByIdAndUpdate(this.#historyRecordID, {
        $set: { 'printHistory.thumbnail': this.#thumbnail },
      })
        .then(async () => {
          await getHistoryCache().initCache();
        })
        .catch((e) => {
          logger.error('Unable to update history filament record: ', e.toString());
        });
    }
    if (serverSettingsCache.history.snapshot.onFailure) {
      this.#snapshot = await this.snapshotCheck();
      await History.findByIdAndUpdate(this.#historyRecordID, {
        $set: { 'printHistory.snapshot': this.#snapshot },
      })
        .then(async () => {
          await getHistoryCache().initCache();
        })
        .catch((e) => {
          logger.error('Unable to update history filament record: ', e.toString());
        });
    }

    if (serverSettingsCache.history.timelapse.onFailure) {
      await this.timelapseCheck();
    }
  }
}

module.exports = {
  HistoryCaptureService,
};
