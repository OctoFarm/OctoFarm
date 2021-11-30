const getFirstDayOfLastMonth = function () {
  var d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString();
};

module.exports = {
  getFirstDayOfLastMonth
};
