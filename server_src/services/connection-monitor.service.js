const { REQUEST_TYPE, REQUEST_KEYS } = require("../constants/connection-monitor.constants");
const { findIndex, cloneDeep } = require("lodash");

const defaultConnectionMonitorLog = {
  lastResponseTimes: [],
  totalRequestsFailed: 0,
  totalRequestsSuccess: 0,
  totalRetries: 0
};

const printerConnectionLogs = [];

class ConnectionMonitorService {
  static acceptedKeys = [
    REQUEST_KEYS.FAILED_RESPONSE,
    REQUEST_KEYS.SUCCESS_RESPONSE,
    REQUEST_KEYS.RETRY_REQUESTED,
    REQUEST_KEYS.LAST_RESPONSE
  ];
  static acceptedTypes = [
    REQUEST_TYPE.GET,
    REQUEST_TYPE.PATCH,
    REQUEST_TYPE.POST,
    REQUEST_TYPE.WEBSOCKET
  ];

  static updateOrAddResponse(url, type, key, value) {
    // Check for required keys...
    if (!this.acceptedTypes.includes(type))
      throw new Error("Incorrect types supplied! Do not know... " + type);
    if (!this.acceptedKeys.includes(key))
      throw new Error("Incorrect key supplied! Do not know... " + key);

    const urlSplit = url.split("/");

    const printerURL = urlSplit[2];
    // Make sure printer index exists
    let printerIndex = findIndex(printerConnectionLogs, function (o) {
      return o.printerURL === printerURL;
    });
    if (printerIndex === -1) {
      printerConnectionLogs.push({
        printerURL: printerURL,
        connections: [
          {
            url: url,
            log: cloneDeep(defaultConnectionMonitorLog)
          }
        ]
      });
    }
    printerIndex = findIndex(printerConnectionLogs, function (o) {
      return o.printerURL === printerURL;
    });
    // Make sure connectionIndex Exists
    let connectionIndex = findIndex(printerConnectionLogs[printerIndex].connections, function (o) {
      return o.url === url;
    });
    if (connectionIndex === -1) {
      printerConnectionLogs[printerIndex].connections.push({
        url: url,
        log: cloneDeep(defaultConnectionMonitorLog)
      });
    }
    connectionIndex = findIndex(printerConnectionLogs[printerIndex].connections, function (o) {
      return o.url === url;
    });
    if (key === REQUEST_KEYS.LAST_RESPONSE) {
      if (!value) throw new Error("No value supplied with " + REQUEST_KEYS.LAST_RESPONSE);
      printerConnectionLogs[printerIndex].connections[connectionIndex].log[
        REQUEST_KEYS.LAST_RESPONSE
      ].push(value);
      if (
        printerConnectionLogs[printerIndex].connections[connectionIndex].log[
          REQUEST_KEYS.LAST_RESPONSE
        ].length > 50
      ) {
        printerConnectionLogs[printerIndex].connections[connectionIndex].log[
          REQUEST_KEYS.LAST_RESPONSE
        ].shift();
      }
    } else {
      printerConnectionLogs[printerIndex].connections[connectionIndex].log[key] =
        printerConnectionLogs[printerIndex].connections[connectionIndex].log[key] + 1;
    }
  }

  static startTimer() {
    return new Date();
  }

  static stopTimer() {
    return new Date();
  }

  static calculateTimer(first, last) {
    return new Date(last).getTime() - new Date(first).getTime();
  }

  static returnConnectionLogs(printerURL) {
    if (!printerURL) return printerConnectionLogs;
    return printerConnectionLogs[printerURL];
  }
}

module.exports = ConnectionMonitorService;
