const getFirstDayOfLastMonth = function () {
  var d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString();
};

const daysBetweenTwoDates = function (date1, date2) {
  return Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24));
};

module.exports = {
  getFirstDayOfLastMonth,
  daysBetweenTwoDates,
};
