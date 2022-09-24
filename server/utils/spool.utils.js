const {
  ALL_MONTHS,
  DEFAULT_SPOOL_RATIO,
  DEFAULT_SPOOL_DENSITY,
} = require('../constants/cleaner.constants');
const { checkNested, checkNestedIndex } = require('./array.util');
const Profiles = require('../models/Profiles');

/**
 * Calculate spool weight static
 * @param length
 * @param filament
 * @param completionRatio
 * @returns {string|*|number}
 */
function calcSpoolWeightAsString(length, filament, completionRatio) {
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
  return (completionRatio * volume * density).toFixed(2);
}

function getCostAsString(grams, spool, completionRatio) {
  if (!spool) {
    return '0.00';
  }
  return completionRatio * ((spool.spools.price / spool.spools.weight) * grams).toFixed(2);
}

function getSpoolLabel(id) {
  const spool = id?.spools;
  if (!spool) {
    return null;
  }

  let spoolLeftoverConditional = '';
  // if (this.#settingsStore.isFilamentEnabled()) {
  //   const spoolWeight = (spool.weight - spool.used).toFixed(0);
  //   spoolLeftoverConditional = `(${spoolWeight}g)`;
  // }
  return `${spool.name} ${spoolLeftoverConditional} - ${spool.profile?.material}`;
}

function getSpool(filamentSelection, job, success, time) {
  // Fix for old database states
  if (!job?.filament) {
    return null;
  }

  let printPercentage = 0;
  if (!success) {
    printPercentage = (time / job.estimatedPrintTime) * 100;
  }

  job = job.filament;

  const spools = [];
  for (const key of Object.keys(job)) {
    const keyIndex = Object.keys(job).indexOf(key);
    const filamentEntry = Array.isArray(filamentSelection)
      ? filamentSelection[keyIndex]
      : filamentSelection;
    const metric = job[key];
    let completionRatio = success ? 1.0 : printPercentage / 100;

    const spoolWeight = calcSpoolWeightAsString(
      metric.length / 1000,
      filamentEntry,
      completionRatio
    );
    const spoolName = getSpoolLabel(filamentEntry);
    spools.push({
      [key]: {
        toolName: 'Tool ' + key.substring(4, 5),
        spoolName,
        spoolId: filamentEntry?._id || null,
        volume: (completionRatio * metric.volume).toFixed(2),
        length: ((completionRatio * metric.length) / 1000).toFixed(2),
        weight: spoolWeight,
        cost: getCostAsString(spoolWeight, filamentEntry, completionRatio),
        type: filamentEntry?.spools?.profile?.material || '',
      },
    });
  }
  return spools;
}

function processHistorySpools(historyCleanEntry, usageOverTime, totalByDay, historyByDay) {
  const spools = historyCleanEntry?.spools;
  const historyState = historyCleanEntry.state;

  const timestampDiffDaysAgo = 90 * 24 * 60 * 60 * 1000;
  let ninetyDaysAgo = new Date(Date.now() - timestampDiffDaysAgo);

  if (!!spools) {
    spools.forEach((spool) => {
      const keys = Object.keys(spool);
      for (const key of keys) {
        // Check if type exists
        let searchKeyword = '';
        let checkNestedResult = checkNested(spool[key].type, totalByDay);
        if (!!checkNestedResult) {
          let checkNestedIndexHistoryRates = null;
          if (historyState.includes('success')) {
            searchKeyword = 'Success';
          } else if (historyState.includes('warning')) {
            searchKeyword = 'Cancelled';
          } else if (historyState.includes('danger')) {
            searchKeyword = 'Failed';
          } else {
            return;
          }
          checkNestedIndexHistoryRates = checkNestedIndex(searchKeyword, historyByDay);

          let checkNestedIndexByDay = checkNestedIndex(spool[key].type, usageOverTime);
          let usageWeightCalc = historyCleanEntry.totalWeight;
          if (!!usageOverTime[checkNestedIndexByDay].data[0]) {
            usageWeightCalc =
              usageOverTime[checkNestedIndexByDay].data[
                usageOverTime[checkNestedIndexByDay].data.length - 1
              ].y + historyCleanEntry.totalWeight;
          }

          let checkedIndex = checkNestedIndex(spool[key].type, totalByDay);
          let weightCalcSan = parseFloat(historyCleanEntry.totalWeight.toFixed(2));

          // Don't include 0 weights
          if (weightCalcSan > 0) {
            let historyDate = historyCleanEntry.endDate;
            let dateSplit = historyDate.split(' ');
            let month = ALL_MONTHS.indexOf(dateSplit[1]);
            let dateString = `${parseInt(dateSplit[3])}-${month + 1}-${parseInt(dateSplit[2])}`;
            let dateParse = new Date(dateString);
            // Check if more than 90 days ago...
            if (dateParse.getTime() > ninetyDaysAgo.getTime()) {
              totalByDay[checkedIndex].data.push({
                x: dateParse,
                y: weightCalcSan,
              });
              usageOverTime[checkedIndex].data.push({
                x: dateParse,
                y: weightCalcSan,
              });
              historyByDay[checkNestedIndexHistoryRates].data.push({
                x: dateParse,
                y: 1,
              });
            }
          }
        } else {
          if (spool[key].type !== '') {
            totalByDay.push({
              name: spool[key].type,
              data: [],
            });
          }
          if (spool[key].type !== '') {
            usageOverTime.push({
              name: spool[key].type,
              data: [],
            });
          }
          if (!historyByDay[0]) {
            historyByDay.push({
              name: 'Success',
              data: [],
            });
            historyByDay.push({
              name: 'Failed',
              data: [],
            });
            historyByDay.push({
              name: 'Cancelled',
              data: [],
            });
          }
        }
      }
    });
  }

  return {
    usageOverTime,
    totalByDay,
    historyByDay,
  };
}

/**
 * @param filamentSelection
 * @param fileLength
 * @returns {*[]}
 */
function getUnits(filamentSelection, fileLength) {
  const strings = [];
  const lengthArray = [];
  const weightArray = [];
  if (!!fileLength) {
    for (let l = 0; l < fileLength.length; l++) {
      const length = fileLength[l] / 1000;
      if (typeof filamentSelection !== 'undefined' && Array.isArray(filamentSelection)) {
        if (filamentSelection[l] === null) {
          const radius = 1.75 / 2;
          const volume = length * Math.PI * radius * radius;
          const usage = volume * 1.24;
          lengthArray.push(length);
          weightArray.push(usage);
          strings.push(`<b>Tool ${l}:</b> ${length.toFixed(2)}m / ${usage.toFixed(2)}g`);
        } else if (typeof filamentSelection[l] !== 'undefined') {
          const radius = parseFloat(filamentSelection[l].spools.profile.diameter) / 2;
          const volume = length * Math.PI * radius * radius;
          const usage = volume * parseFloat(filamentSelection[l].spools.profile.density);
          lengthArray.push(length);
          weightArray.push(usage);
          strings.push(`<b>Tool ${l}:</b> ${length.toFixed(2)}m / ${usage.toFixed(2)}g`);
        } else {
          lengthArray.push(0);
          weightArray.push(0);
          strings.push(`<b>Tool ${l}:</b> (No Spool)`);
        }
      } else {
        lengthArray.push(0);
        weightArray.push(0);
        strings.push(`<b>Tool ${l}:</b> (No Spool)`);
      }
    }

    const totalLength = lengthArray.reduce((a, b) => a + b, 0);
    const totalGrams = weightArray.reduce((a, b) => a + b, 0);
    const total = `<b>Total: </b>${totalLength.toFixed(2)}m / ${totalGrams.toFixed(2)}g`;
    strings.unshift(total);
    return strings;
  }
  return [];
}

/**
 *
 * @param filamentSelection
 * @param units
 * @returns {*[]}
 */
function getCost(filamentSelection, units) {
  units = JSON.parse(JSON.stringify(units));
  if (!Array.isArray(units) || units.length === 0) {
    return [];
  }

  const strings = [];
  const costArray = [];
  filamentSelection = JSON.parse(JSON.stringify(filamentSelection));
  filamentSelection.unshift('SKIP');
  for (let u = 0; u < units.length; u++) {
    if (typeof filamentSelection !== 'undefined' && Array.isArray(filamentSelection)) {
      if (filamentSelection[u] === 'SKIP') {
      } else if (typeof filamentSelection[u] !== 'undefined' && filamentSelection[u] !== null) {
        let newUnit = units[u].split(' / ');
        newUnit = newUnit[1].replace('g', '');
        if (!units[u].includes('Total')) {
          const cost = (
            (filamentSelection[u].spools.price / filamentSelection[u].spools.weight) *
            parseFloat(newUnit)
          ).toFixed(2);
          costArray.push(parseFloat(cost));
          strings.push(cost);
        }
      } else {
        costArray.push(0);
        strings.push('(No Spool)');
      }
    } else {
      costArray.push(0);
      strings.push('(No Spool)');
    }
  }
  const totalCost = costArray.reduce((a, b) => a + b, 0);
  strings.unshift(totalCost.toFixed(2));
  return strings;
}

const attachProfileToSpool = async (id) => {
  const profile = await Profiles.findById(id);
  return profile.profile;
};

module.exports = {
  calcSpoolWeightAsString,
  processHistorySpools,
  getSpool,
  getUnits,
  getCost,
  getCostAsString,
  attachProfileToSpool,
};
