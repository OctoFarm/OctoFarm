const { DateTime } = require("luxon");

function toTimeFormat(printTime) {
  if (!printTime) {
    return "?";
  }

  printTime = printTime * 1000;
  const h = Math.floor(printTime / 1000 / 60 / 60);
  const m = Math.floor((printTime / 1000 / 60 / 60 - h) * 60);
  const s = Math.floor(((printTime / 1000 / 60 / 60 - h) * 60 - m) * 60);
  return `${h}:${m}`;
}

function getCompletionDate(printTimeLeftSeconds, completion) {
  if (completion === 100) {
    return "No Active Job";
  }

  const printDoneDT = DateTime.now().plus({ seconds: printTimeLeftSeconds });
  return printDoneDT.toFormat("ccc LLL dd yyyy: HH:mm");
}

function getDayName() {
  return new Intl.DateTimeFormat(["en"], {
    weekday: "long" // ?? what should I put here
  }).format(new Date());
}

/**
 * Calculate a start and end time using a duration and 'now' as end
 * @param printDuration
 * @returns {{endDate: string, startDate: string}}
 */
function durationToDates(printDuration) {
  const today = new Date();
  const printTime = new Date(printDuration * 1000);
  let startDate = today.getTime() - printTime.getTime();
  startDate = new Date(startDate);

  const startDDMM = startDate.toDateString();
  const startTime = startDate.toTimeString();
  const startTimeFormat = startTime.substring(0, 8);
  startDate = `${startDDMM} - ${startTimeFormat}`;

  const endDDMM = today.toDateString();
  const endTime = today.toTimeString();
  const endTimeFormat = endTime.substring(0, 8);
  const endDate = `${endDDMM} - ${endTimeFormat}`;

  return {
    startDate,
    endDate
  };
}

module.exports = {
  toTimeFormat,
  durationToDates,
  getCompletionDate,
  getDayName
};
