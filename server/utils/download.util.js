const fetch = require("node-fetch");
const fs = require("fs");
const request = require("request");
const { LOGGER_ROUTE_KEYS } = require('../constants/logger.constants');
const Logger = require('../handlers/logger.js');
const logger = new Logger(LOGGER_ROUTE_KEYS.ROUTE_SYSTEM_SETTINGS);

const downloadFromOctoPrint = async (url, path, apiKey, deleteTimelapse) => {
  logger.warning("Downloading file from OctoPrint", {
    url, path, deleteTimelapse
  })
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey
    }
  });
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("close", async () => {
      logger.warning("Downloaded file from OctoPrint", {
        url, path, deleteTimelapse
      })
      resolve();
      if (!!deleteTimelapse) {
        deleteTimelapse();
      }
    });
  });
};

const downloadImage = async (url, path, apiKey, callback) => {
  logger.warning("Downloading file from OctoPrint", {
    url, path, callback
  })
  return request.head(url, (err, res) => {
    res.headers["content-type"] = "image/png";
    res.headers["x-api-key"] = apiKey;
    request(url).pipe(fs.createWriteStream(path)).on("close", callback);
  });
};

const downloadGitZip = async (url, path, headers, callback) => {
  logger.warning("Downloading file from github", {
    url, path, callback
  })
  return request.head(url, (err, res) => {
    res.headers = headers;
    request(url).pipe(fs.createWriteStream(path)).on("close", callback);
  });

};

module.exports = {
  downloadFromOctoPrint,
  downloadImage,
  downloadGitZip
};
