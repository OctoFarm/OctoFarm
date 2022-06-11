"use strict";

const fetch = require("node-fetch");
const Logger = require("../../handlers/logger.js");
const { LOGGER_ROUTE_KEYS } = require("../../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.OP_SERVICE_API);

const ConnectionMonitorService = require("../connection-monitor.service");
const { REQUEST_TYPE, REQUEST_KEYS } = require("../../constants/connection-monitor.constants");
const { promiseTimeout } = require("../../utils/promise.utils");

async function fetchApi(url, method, apikey, bodyData = undefined) {
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apikey
    },
    body: JSON.stringify(bodyData)
  }).catch((e) => {
    logger.error("Failed to fetch!", e);
    logger.error("Fetch data string", e.toString());
    logger.debug("Fetch connection data", {
      url,
      method,
      apikey,
      bodyData
    });
    return e;
  });
}

async function fetchApiTimeout(url, method, apikey, fetchTimeout, bodyData = undefined) {
  const startTime = ConnectionMonitorService.startTimer();
  return promiseTimeout(fetchTimeout, fetchApi(url, method, apikey, bodyData))
    .then((res) => {
      const endTime = ConnectionMonitorService.stopTimer();
      ConnectionMonitorService.updateOrAddResponse(
        url,
        REQUEST_TYPE[method],
        REQUEST_KEYS.LAST_RESPONSE,
        ConnectionMonitorService.calculateTimer(startTime, endTime)
      );
      ConnectionMonitorService.updateOrAddResponse(
        url,
        REQUEST_TYPE[method],
        REQUEST_KEYS.SUCCESS_RESPONSE
      );
      return res;
    })
    .catch((e) => {
      logger.http("Promise timeout threw an error!", {
        error: e.toString(),
        url,
        method,
        bodyData
      });
      ConnectionMonitorService.updateOrAddResponse(
        url,
        REQUEST_TYPE[method],
        REQUEST_KEYS.FAILED_RESPONSE
      );
      const endTime = ConnectionMonitorService.stopTimer();
      ConnectionMonitorService.updateOrAddResponse(
        url,
        REQUEST_TYPE[method],
        REQUEST_KEYS.LAST_RESPONSE,
        ConnectionMonitorService.calculateTimer(startTime, endTime)
      );
      return e;
    });
}

class OctoprintApiService {
  timeout = undefined;
  printerURL = undefined;
  apikey = undefined;
  #currentTimeout = 2000;

  constructor(printerURL, apikey, timeoutSettings) {
    this.timeout = timeoutSettings;
    this.printerURL = printerURL;
    this.apikey = apikey;
    this.#currentTimeout = timeoutSettings.apiTimeout;
  }

  updateConnectionInformation(printerURL, apikey) {
    this.printerURL = printerURL;
    this.apikey = apikey;
  }

  /**
   * Fire an action onto OctoPrint API
   * @param route
   * @param data race to timeout (default: true)
   * @returns {Promise<unknown>}
   */
  async post(route, data) {
    const url = new URL(route, this.printerURL).href;
    return fetchApiTimeout(url, "POST", this.apikey, this.#currentTimeout, data).catch((e) => {
      return e;
    });
  }

  /**
   * Delete request onto OctoPrint API
   * @param route
   * @returns {Promise<unknown>}
   */
  async delete(route) {
    const url = new URL(route, this.printerURL).href;
    return fetchApiTimeout(url, "DELETE", this.apikey, this.#currentTimeout).catch((e) => {
      return e;
    });
  }

  /**
   * Acquire a GET resource
   * @param route
   * @param amendTimeout
   * @returns {Promise<unknown>}
   */
  async get(route, amendTimeout = 0) {
    const url = new URL(route, this.printerURL).href;
    const amendedTimeout = this.#currentTimeout + amendTimeout;
    return fetchApiTimeout(url, "GET", this.apikey, amendedTimeout).catch((e) => {
      return e;
    });
  }

  /**
   * Call a PATCH action
   * @param route
   * @param data body to be patchede to timeout (default: true)
   * @returns {Promise<unknown>}
   */
  patch(route, data) {
    const url = new URL(route, this.printerURL).href;
    return fetchApiTimeout(url, "PATCH", this.apikey, this.#currentTimeout, data).catch((e) => {
      return e;
    });
  }
}

module.exports = {
  OctoprintApiService
};
