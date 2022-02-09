const getFirstDayOfLastMonth = function () {
  var d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d;
};

const last12Month = function () {
  var dates = [];
  (d = new Date()), (y = d.getFullYear()), (m = d.getMonth());
  function padMonth(month) {
    if (month < 10) {
      return "0" + month;
    } else {
      return month;
    }
  }

  if (m === 11) {
    for (var i = 1; i < 13; i++) {
      dates.push(y + "-" + padMonth(i) + "-01");
    }
  } else {
    for (var i = m + 1; i < m + 13; i++) {
      if (i % 12 > m) {
        dates.push(y - 1 + "-" + padMonth(i + 1) + "-01");
      } else {
        dates.push(y + "-" + padMonth((i % 12) + 1) + "-01");
      }
    }
  }
  return dates;
};

const getDatesBetweenDates = function (startDate, endDate) {
  let dates = [];
  //to avoid modifying the original date
  const theDate = new Date(startDate);
  while (theDate < endDate) {
    console.log(theDate);

    theDate.setDate(theDate.getDate() + 1);
  }
  return dates;
};

const generateTodayTextString = () => {
  let dateString = "";
  const today = new Date();
  dateString += today.toLocaleDateString().replace(/\//g, "-");
  dateString += "-" + today.toLocaleTimeString().replace(/:/g, "-");
  return dateString;
};

module.exports = {
  getFirstDayOfLastMonth,
  last12Month,
  getDatesBetweenDates,
  generateTodayTextString
};
