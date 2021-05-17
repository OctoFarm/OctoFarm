const fetch = require("node-fetch");
const fs = require("fs");

const downloadFromOctoPrint = async (url, path, callback, apiKey) => {
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
    fileStream.on("finish", callback);
  });
};

module.exports = {
  downloadFromOctoPrint
};
