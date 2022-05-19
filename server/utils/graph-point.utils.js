/**
 * Cumulative sum operator over numeric-only Y-values
 * @param input
 * @returns {[]}
 */
function assignYCumSum(input) {
  let cumSum = 0;
  return input
    .filter((elem) => elem?.hasOwnProperty("x"))
    .map((elem) => ({
      x: elem?.x,
      y: (cumSum += elem?.y || 0)
    }));
}

function sumValuesGroupByDate(input) {
  const dates = {};
  input.forEach((dv) => (dates[dv.x] = (dates[dv.x] || 0) + dv.y));
  return Object.keys(dates).map((date) => ({
    x: new Date(date),
    y: dates[date]
  }));
}

module.exports = {
  sumValuesGroupByDate,
  assignYCumSum
};
