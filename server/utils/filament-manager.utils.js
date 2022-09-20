const Logger = require('../handlers/logger');
const { LOGGER_ROUTE_KEYS } = require('../constants/logger.constants');
const logger = new Logger(LOGGER_ROUTE_KEYS.OP_UTIL_FILAMENT_MANAGER_PLUGIN);
const Spool = require('../models/Filament.js');
const { getPrinterStoreCache } = require('../cache/printer-store.cache');

const checkIfSpoolAttachedToPrinter = function (spoolId) {
  const printerList = getPrinterStoreCache().listPrinters();
  const filteredList = printerList.filter((printer) => printer.selectedFilament.length > 0);
  let isSpoolAttached = false;
  for (const element of filteredList) {
    const doWeHaveSpoolIndex = element.selectedFilament.some((spool) => spool?._id === spoolId);
    if (doWeHaveSpoolIndex) {
      isSpoolAttached = true;
    }
  }
  return isSpoolAttached;
};

const checkIfProfileAttachedToSpool = async function (profileId) {
  const attachedSpools = await Spool.find({ 'spools.profile': profileId });
  return attachedSpools.length > 0;
};

module.exports = {
  checkIfSpoolAttachedToPrinter,
  checkIfProfileAttachedToSpool,
};
