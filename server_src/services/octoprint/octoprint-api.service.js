"use strict";

const fetch = require("node-fetch");
const Logger = require("../../handlers/logger.js");

const logger = new Logger("OctoPrint-API-Service");

const ConnectionMonitorService = require("../connection-monitor.service");
const { REQUEST_TYPE, REQUEST_KEYS } = require("../../constants/connection-monitor.constants");

async function fetchApi(url, method, apiKey, bodyData = undefined) {
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey
    },
    body: JSON.stringify(bodyData)
  });
}

async function fetchApiTimeout(url, method, apiKey, fetchTimeout, bodyData = undefined) {
  const startTime = ConnectionMonitorService.startTimer();
  if (!fetchTimeout || method !== "GET") {
    return await fetchApi(url, method, apiKey, bodyData)
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
          REQUEST_KEYS.FAILED_RESPONSE
        );
        return e;
      });
  }
  return Promise.race([
    fetchApi(url, method, apiKey, bodyData),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), fetchTimeout))
  ])
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
        REQUEST_KEYS.RETRY_REQUESTED
      );
      ConnectionMonitorService.updateOrAddResponse(
        url,
        REQUEST_TYPE[method],
        REQUEST_KEYS.FAILED_RESPONSE
      );
      return e;
    });
}

class OctoprintApiService {
  timeout = undefined;

  constructor(timeoutSettings) {
    this.timeout = timeoutSettings;
  }

  /**
   * Retry mechanism for slow/timeout state OctoPrint entries
   * @param printerURL
   * @param apiKey
   * @param item
   * @returns {Promise<Promise<Response>|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise<Response>|Promise<unknown>)|*|undefined>}
   */
  async getRetry(printerURL, apiKey, item) {
    try {
      return await this.get(printerURL, apiKey, item);
    } catch (err) {
      const message = `Error connecting to OctoPrint API: ${item} | ${printerURL}`;
      logger.error(`${message} | timeout: ${this.timeout.apiTimeout}`, JSON.stringify(err.message));
      // If timeout exceeds max cut off then give up... Printer is considered offline.
      if (this.timeout.apiTimeout >= this.timeout.apiRetryCutoff) {
        logger.info(`Timeout Exceeded: ${item} | ${printerURL}`);
        throw err;
      }
      // Make sure to use the settings for api retry.
      // TODO: Fix apiRetryCutoff + apiRetry as they are swapped.
      this.timeout.apiTimeout = this.timeout.apiRetryCutoff;
      return await this.getRetry(printerURL, apiKey, item);
    }
  }

  /**
   * Fire an action onto OctoPrint API
   * @param printerURL
   * @param apiKey
   * @param route
   * @param data
   * @param timeout optional race to timeout (default: true)
   * @returns {Promise<Promise<Response>|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise<Response>|Promise<unknown>)>}
   */
  post(printerURL, apiKey, route, data, timeout = true) {
    if (!printerURL.includes("http")) {
      printerURL = "http://" + printerURL;
    }
    const url = new URL(route, printerURL).href;

    return fetchApiTimeout(url, "POST", apiKey, timeout ? this.timeout.apiTimeout : false, data);
    // const endTime = ConnectionMonitorService.stopTimer();
    //
    // ConnectionMonitorService.updateOrAddResponse(
    //   printerURL,
    //   REQUEST_TYPE.POST,
    //   REQUEST_KEYS.LAST_RESPONSE,
    //   ConnectionMonitorService.calculateTimer(startTime, endTime)
    // );
    //
    // if (
    //   response?.status >= ACCEPTABLE_STATUS_CODES[0] &&
    //   response?.status <= ACCEPTABLE_STATUS_CODES[1]
    // ) {
    //   ConnectionMonitorService.updateOrAddResponse(
    //     printerURL,
    //     REQUEST_TYPE.POST,
    //     REQUEST_KEYS.SUCCESS_RESPONSE
    //   );
    // } else {
    //   ConnectionMonitorService.updateOrAddResponse(
    //     printerURL,
    //     REQUEST_TYPE.POST,
    //     REQUEST_KEYS.FAILED_RESPONSE
    //   );
    // }
    // return response;
  }

  /**
   * Acquire a GET resource
   * @param printerURL
   * @param apiKey
   * @param route
   * @param timeout optional race to timeout (default: true)
   * @returns {Promise<Promise<Response>|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise<Response>|Promise<unknown>)>}
   */
  get(printerURL, apiKey, route, timeout = true) {
    if (!printerURL.includes("http")) {
      printerURL = "http://" + printerURL;
    }
    //

    const url = new URL(route, printerURL).href;
    const startTime = ConnectionMonitorService.startTimer();
    return fetchApiTimeout(url, "GET", apiKey, timeout ? this.timeout.apiTimeout : false);

    // const endTime = ConnectionMonitorService.stopTimer();
    // ConnectionMonitorService.updateOrAddResponse(
    //   printerURL,
    //   REQUEST_TYPE.POST,
    //   REQUEST_KEYS.LAST_RESPONSE,
    //   ConnectionMonitorService.calculateTimer(startTime, endTime)
    // );
    //
    // if (
    //   response?.status >= ACCEPTABLE_STATUS_CODES[0] &&
    //   response?.status <= ACCEPTABLE_STATUS_CODES[1]
    // ) {
    //   ConnectionMonitorService.updateOrAddResponse(
    //     printerURL,
    //     REQUEST_TYPE.GET,
    //     REQUEST_KEYS.SUCCESS_RESPONSE
    //   );
    // } else {
    //   ConnectionMonitorService.updateOrAddResponse(
    //     printerURL,
    //     REQUEST_TYPE.GET,
    //     REQUEST_KEYS.FAILED_RESPONSE
    //   );
    // }
    // return response;
  }

  /**
   * Call a PATCH action
   * @param printerURL
   * @param apiKey
   * @param route
   * @param data body to be patched
   * @param timeout optional race to timeout (default: true)
   * @returns {Promise<*|Promise|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise|Promise<unknown>)>}
   */
  patch(printerURL, apiKey, route, data, timeout = true) {
    if (!printerURL.includes("http")) {
      printerURL = "http://" + printerURL;
    }
    const url = new URL(route, printerURL).href;
    const startTime = ConnectionMonitorService.startTimer();
    return fetchApiTimeout(url, "PATCH", apiKey, timeout ? this.timeout.apiTimeout : false, data);
    // const endTime = ConnectionMonitorService.stopTimer();
    // ConnectionMonitorService.updateOrAddResponse(
    //   printerURL,
    //   REQUEST_TYPE.POST,
    //   REQUEST_KEYS.LAST_RESPONSE,
    //   ConnectionMonitorService.calculateTimer(startTime, endTime)
    // );
    //
    // if (
    //   response?.status >= ACCEPTABLE_STATUS_CODES[0] &&
    //   response?.status <= ACCEPTABLE_STATUS_CODES[1]
    // ) {
    //   ConnectionMonitorService.updateOrAddResponse(
    //     printerURL,
    //     REQUEST_TYPE.PATCH,
    //     REQUEST_KEYS.SUCCESS_RESPONSE
    //   );
    // } else {
    //   ConnectionMonitorService.updateOrAddResponse(
    //     printerURL,
    //     REQUEST_TYPE.PATCH,
    //     REQUEST_KEYS.FAILED_RESPONSE
    //   );
    // }
    // return response;
  }

  // /**
  //  * Acquire OctoPrint file references using GET and a timeout
  //  * @param printerURL
  //  * @param apiKey
  //  * @param item
  //  * @param timeout optional race to timeout (default: true)
  //  * @returns {Promise<Promise<Response>|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise<Response>|Promise<unknown>)>}
  //  */
  // files(printerURL, apiKey, item, timeout = true) {
  //   const url = new URL('api/' + item, printerURL).href;
  //   return fetchApiTimeout(url, "GET", apiKey, timeout ? this.timeout.apiTimeout : false);
  // }
}

module.exports = {
  OctoprintApiService
};
