const currentIssues = [];

const loggerAmmount = 5000;

class PrinterConnectionLogService {
  static addIssue(date, printer, message, state, printerID) {
    let id = null;
    if (currentIssues.length === 0) {
      //first issue
      id = 0;
    } else {
      id = currentIssues[currentIssues.length - 1].id + 1;
    }
    const newIssue = {
      id: id,
      date: date,
      message: message,
      printerID: printerID,
      printer: printer,
      state: state
    };
    currentIssues.push(newIssue);

    if (currentIssues.length >= loggerAmmount) {
      currentIssues.shift();
    }
  }

  static removeIssue(id) {
    const index = _.findIndex(currentIssues, function (o) {
      return o.id == id;
    });
    currentIssues.splice(index, 1);
  }

  static returnIssue() {
    return currentIssues;
  }
}

module.exports = {
  PrinterTicker: PrinterConnectionLogService
};
