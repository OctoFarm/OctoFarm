"use strict";

const axios = require("axios");

function convertHttpUrlToWebsocket(url) {
  if (url.includes("http://")) {
    return url.replace("http://", "ws://");
  } else if (url.includes("https://")) {
    return url.replace("https://", "wss://");
  } else if (!url.includes("ws://")) {
    return "ws://" + url;
  }
}

/**
 * Checks the response of a URL
 * @throws {Error} If the state is not correctly provided as a Boolean.
 * @param url
 */
async function validateURL(url) {
  // Make sure URL is a string
  if (typeof url !== "string") {
    throw new TypeError(`Expected a string, got ${typeof url}`);
  }

  // Make sure url has white space
  url = url.trim();
  if (url.includes(" ")) {
    return false;
  }
  return new URL(url);
}

module.exports = {
  convertHttpUrlToWebsocket,
  validateURL
};
