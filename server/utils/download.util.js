const fetch = require("node-fetch");
const fs = require("fs");
const request = require("request");

const downloadFromOctoPrint = async (url, path, apiKey, deleteTimelapse) => {
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
      resolve();
      if (!!deleteTimelapse) {
        deleteTimelapse();
      }
    });
  });
};

const downloadImage = async (url, path, apiKey, callback) => {
  return request.head(url, (err, res) => {
    res.headers["content-type"] = "image/png";
    res.headers["x-api-key"] = apiKey;
    request(url).pipe(fs.createWriteStream(path)).on("close", callback);
  });
};

module.exports = {
  downloadFromOctoPrint,
  downloadImage
};
