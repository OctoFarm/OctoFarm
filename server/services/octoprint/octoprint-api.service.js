"use strict";

const fetch = require("node-fetch");
const Logger = require("../../handlers/logger.js");

const logger = new Logger("OctoFarm-State");

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
  }).catch(e => {
    logger.error("Failed to fetch!", e);
    logger.error("Fetch data string", e.toString());
    logger.debug("Fetch connection data", {
      url, method, apikey, bodyData
    })
    return e;
  });
}

async function fetchApiTimeout(url, method, apikey, fetchTimeout, bodyData = undefined) {
  const startTime = ConnectionMonitorService.startTimer();
  if (!fetchTimeout || method !== "GET") {
    return fetchApi(url, method, apikey, bodyData)
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
        logger.error("Failed to fetch timeout!", e);
        logger.error("Fetch timeout! data string", e.toString());
        logger.debug("Fetch timeout! connection data", {
          url, method, apikey, fetchTimeout, bodyData
        })
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
      logger.debug("Failed fetch timeout!", e);
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
  #currentTimeout = 0;

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
   * @param data
   * @param timeout optional race to timeout (default: true)
   * @returns {Promise<unknown>}
   */
  async post(route, data, timeout = true) {
    const url = new URL(route, this.printerURL).href;
    return fetchApiTimeout(
      url,
      "POST",
      this.apikey,
      timeout ? this.#currentTimeout : false,
      data
    ).catch((e) => {
      return e;
    });
  }

  /**
   * Delete request onto OctoPrint API
   * @param route
   * @param timeout
   * @returns {Promise<unknown>}
   */
  async delete(route, timeout = true) {
    const url = new URL(route, this.printerURL).href;
    return fetchApiTimeout(
      url,
      "DELETE",
      this.apikey,
      timeout ? this.#currentTimeout : false
    ).catch((e) => {
      return e;
    });
  }

  /**
   * Acquire a GET resource
   * @param route
   * @param timeout optional race to timeout (default: true)
   * @returns {Promise<unknown>}
   */
  async get(route, timeout = true) {
    const url = new URL(route, this.printerURL).href;
    return fetchApiTimeout(url, "GET", this.apikey, timeout ? this.#currentTimeout : false).catch(
      (e) => {
        return e;
      }
    );
  }

  /**
   * Call a PATCH action
   * @param route
   * @param data body to be patched
   * @param timeout optional race to timeout (default: true)
   * @returns {Promise<unknown>}
   */
  patch(route, data, timeout = true) {
    const url = new URL(route, this.printerURL).href;
    return fetchApiTimeout(
      url,
      "PATCH",
      this.apikey,
      timeout ? this.#currentTimeout : false,
      data
    ).catch((e) => {
      return e;
    });
  }

  // /**
  //  * Acquire OctoPrint file references using GET and a timeout
  //  * @param printerURL
  //  * @param apikey
  //  * @param item
  //  * @param timeout optional race to timeout (default: true)
  //  * @returns {Promise<Promise<Response>|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise<Response>|Promise<unknown>)>}
  //  */
  // files(printerURL, apikey, item, timeout = true) {
  //   const url = new URL('api/' + item, printerURL).href;
  //   return fetchApiTimeout(url, "GET", apikey, timeout ? this.timeout.apiTimeout : false);
  // }
}

module.exports = {
  OctoprintApiService
};
