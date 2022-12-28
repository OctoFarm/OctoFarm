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

  let received_bytes = 0;
  let total_bytes = 0;
  let lastPercentLogged = 0;
  const fileStream = fs.createWriteStream(path).on("close", async () => {
    console.log("WRITE DONE calling")
    await callback();
  })

  return request
      .get(url, null, null)
      .on('error', function(err) {
        logger.error("Unable to download remote zip file!", err)
      })
      .on('response', function(data) {
        total_bytes = parseInt(data.headers['content-length']);
      })
      .on('data', function(chunk) {
        received_bytes += chunk.length;
        const percent = ((received_bytes * 100) / total_bytes).toFixed(2)
        if(lastPercentLogged !== percent){
          lastPercentLogged = percent;
          logger.warning(`Downloaded: ${percent}%`, {
            received_bytes, total_bytes
          })
        }

      })
      .pipe(fileStream);
};

module.exports = {
  downloadFromOctoPrint,
  downloadImage,
  downloadGitZip
};
