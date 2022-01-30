"use strict";

const fetch = require("node-fetch");
const Logger = require("../../handlers/logger.js");

const logger = new Logger("OctoFarm-State");

const ConnectionMonitorService = require("../connection-monitor.service");
const { REQUEST_TYPE, REQUEST_KEYS } = require("../../constants/connection-monitor.constants");
const { promiseTimeout } = require("../../utils/promise.utils");

async function fetchApi(url, method, apikey, bodyData = undefined) {
  return await fetch(url, {
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
        logger.error("Failed to fetch", e);
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
      logger.error("Failed fetch timeout!", e);
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
      throw e;
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
   * Retry mechanism for slow/timeout state OctoPrint entries
   * @param item
   * @returns {Promise<Promise<Response>|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise<Response>|Promise<unknown>)|*|undefined>}
   */
  async getRetry(item) {
    try {
      return await this.get(item);
    } catch (e) {
      switch (e.code) {
        case "ECONNREFUSED":
          ConnectionMonitorService.updateOrAddResponse(
            this.printerURL + item,
            REQUEST_TYPE.GET,
            REQUEST_KEYS.CONNECTION_FAILURES
          );
          throw 502;
        case "ECONNRESET":
          ConnectionMonitorService.updateOrAddResponse(
            this.printerURL + item,
            REQUEST_TYPE.GET,
            REQUEST_KEYS.CONNECTION_FAILURES
          );
          throw 502;
        case "EHOSTUNREACH":
          ConnectionMonitorService.updateOrAddResponse(
            this.printerURL + item,
            REQUEST_TYPE.GET,
            REQUEST_KEYS.CONNECTION_FAILURES
          );
          throw 404;
        case "ENOTFOUND":
          ConnectionMonitorService.updateOrAddResponse(
            this.printerURL + item,
            REQUEST_TYPE.GET,
            REQUEST_KEYS.CONNECTION_FAILURES
          );
          throw 404;
        default:
          // If timeout exceeds max cut off then give up... Printer is considered offline.
          const cutOffIn = this.timeout.apiRetryCutoff - this.#currentTimeout;
          if (cutOffIn === 0) {
            logger.error(`${this.printerURL} | Cutoff reached! marking offline!`);
          } else {
            logger.error(
              `${this.printerURL} | Current Timeout: ${
                this.#currentTimeout
              } | Cut off in ${cutOffIn}`
            );
          }
          ConnectionMonitorService.updateOrAddResponse(
            this.printerURL + item,
            REQUEST_TYPE.GET,
            REQUEST_KEYS.RETRY_REQUESTED
          );
          if (this.#currentTimeout >= this.timeout.apiRetryCutoff) {
            logger.error(
              `${this.printerURL} | Timeout Exceeded: ${item} | Timeout: ${this.#currentTimeout}`
            );
            // Reset the timeout after failed...
            this.#currentTimeout = JSON.parse(JSON.stringify(this.timeout.apiTimeout));
            throw 408;
          }
          // Make sure to use the settings for api retry.
          this.#currentTimeout = this.#currentTimeout + 9000;
          logger.error(this.printerURL + " | Initial timeout failed increasing...", {
            timeout: this.#currentTimeout
          });
          return await this.getRetry(item);
      }
    }
  }

  /**
   * Fire an action onto OctoPrint API
   * @param route
   * @param data
   * @param timeout optional race to timeout (default: true)
   * @returns {Promise<Promise<Response>|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise<Response>|Promise<unknown>)>}
   */
  async post(route, data, timeout = true) {
    const url = new URL(route, this.printerURL).href;
    return await fetchApiTimeout(
      url,
      "POST",
      this.apikey,
      timeout ? this.#currentTimeout : false,
      data
    );
  }

  /**
   * Acquire a GET resource
   * @param route
   * @param timeout optional race to timeout (default: true)
   * @returns {Promise<Promise<Response>|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise<Response>|Promise<unknown>)>}
   */
  async get(route, timeout = true) {
    const url = new URL(route, this.printerURL).href;
    return await fetchApiTimeout(url, "GET", this.apikey, timeout ? this.#currentTimeout : false);
  }

  /**
   * Call a PATCH action
   * @param route
   * @param data body to be patched
   * @param timeout optional race to timeout (default: true)
   * @returns {Promise<*|Promise|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise|Promise<unknown>)>}
   */
  patch(route, data, timeout = true) {
    const url = new URL(route, this.printerURL).href;
    return fetchApiTimeout(url, "PATCH", this.apikey, timeout ? this.#currentTimeout : false, data);
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
