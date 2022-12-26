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

const downloadGitZip = async (url, path, headers, callback) => {
  console.log(url, path, callback)
  console.log(headers)
  var req = request({
    method: 'GET',
    uri: url,
    headers
  });

  req.pipe(fs.createWriteStream(path)).on("close", callback);

  var body = "";
  var cur = 0;
  var total = 16384 / 1048576; //1048576 - bytes in  1Megabyte
  req.on('data', function (chunk) {
    body += chunk;
    cur += chunk.length;
    console.log("Downloading " + (100.0 * cur / 16384).toFixed(2) + "% " + (cur / 16384).toFixed(2) + " mb\r" + ".<br/> Total size: " + total.toFixed(2) + " mb")
  });

  req.on('end', function() {
    //Do something
  });

};

module.exports = {
  downloadFromOctoPrint,
  downloadImage,
  downloadGitZip
};
