const ping = require("node-http-ping");

const pingTestHost = (host) => {
  const url = new URL(host);

  if (!url) {
    throw new Error("Couldn't generate URL from provided host!");
  }

  return ping(url.hostname, parseInt(url.port))
    .then((time) => time)
    .catch(() => -1);
};

module.exports = {
  pingTestHost
};
