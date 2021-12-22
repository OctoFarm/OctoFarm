"use strict";

const fetch = require("node-fetch");
const Logger = require("../../handlers/logger.js");

const logger = new Logger("OctoPrint-API-Service");

const ConnectionMonitorService = require("../connection-monitor.service");
const { REQUEST_TYPE, REQUEST_KEYS } = require("../../constants/connection-monitor.constants");

async function fetchApi(url, method, apikey, bodyData = undefined) {
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apikey
    },
    body: JSON.stringify(bodyData)
  });
}

async function fetchApiTimeout(url, method, apikey, fetchTimeout, bodyData = undefined) {
  const startTime = ConnectionMonitorService.startTimer();
  if (!fetchTimeout || method !== "GET") {
    return await fetchApi(url, method, apikey, bodyData)
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
        ConnectionMonitorService.updateOrAddResponse(
          url,
          REQUEST_TYPE[method],
          REQUEST_KEYS.FAILED_RESPONSE
        );
        return e;
      });
  }
  return Promise.race([
    fetchApi(url, method, apikey, bodyData),
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
  printerURL = undefined;
  apikey = undefined;

  constructor(printerURL, apikey, timeoutSettings) {
    this.timeout = timeoutSettings;
    this.printerURL = printerURL;
    this.apikey = apikey;
  }

  /**
   * Retry mechanism for slow/timeout state OctoPrint entries
   * @param item
   * @returns {Promise<Promise<Response>|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise<Response>|Promise<unknown>)|*|undefined>}
   */
  async getRetry(item) {
    try {
      return await this.get(item);
    } catch (err) {
      const message = `Error connecting to OctoPrint API: ${item} | ${printerURL}`;
      logger.error(`${message} | timeout: ${this.timeout.apiTimeout}`, JSON.stringify(err.message));
      // If timeout exceeds max cut off then give up... Printer is considered offline.
      if (this.timeout.apiTimeout >= this.timeout.apiRetryCutoff) {
        logger.info(`Timeout Exceeded: ${item} | ${printerURL}`);
        throw err;
      }
      // Make sure to use the settings for api retry.
      this.timeout.apiTimeout = this.timeout.apiTimeout + 5000;
      return await this.getRetry(item);
    }
  }

  /**
   * Fire an action onto OctoPrint API
   * @param printerURL
   * @param apikey
   * @param route
   * @param data
   * @param timeout optional race to timeout (default: true)
   * @returns {Promise<Promise<Response>|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise<Response>|Promise<unknown>)>}
   */
  post(route, data, timeout = true) {
    if (!this.printerURL.includes("http")) {
      this.printerURL = "http://" + this.printerURL;
    }
    const url = new URL(route, this.printerURL).href;

    return fetchApiTimeout(
      url,
      "POST",
      this.apikey,
      timeout ? this.timeout.apiTimeout : false,
      data
    );
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
   * @param route
   * @param timeout optional race to timeout (default: true)
   * @returns {Promise<Promise<Response>|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise<Response>|Promise<unknown>)>}
   */
  get(route, timeout = true) {
    if (!this.printerURL.includes("http")) {
      this.printerURL = "http://" + this.printerURL;
    }
    //
    const url = new URL(route, this.printerURL).href;
    return fetchApiTimeout(url, "GET", this.apikey, timeout ? this.timeout.apiTimeout : false);

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
   * @param route
   * @param data body to be patched
   * @param timeout optional race to timeout (default: true)
   * @returns {Promise<*|Promise|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise|Promise<unknown>)>}
   */
  patch(route, data, timeout = true) {
    if (!this.printerURL.includes("http")) {
      printerURL = "http://" + this.printerURL;
    }
    const url = new URL(route, this.printerURL).href;
    const startTime = ConnectionMonitorService.startTimer();
    return fetchApiTimeout(
      url,
      "PATCH",
      this.apikey,
      timeout ? this.timeout.apiTimeout : false,
      data
    );
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
