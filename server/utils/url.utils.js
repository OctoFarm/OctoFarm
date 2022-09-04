function isValidHttpUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (e) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

function isValidWebsocketUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "ws:" || url.protocol === "wss:";
}

function sanitizeURL(url) {
  if (!url) return;
  return new URL(url).href;
}

function parseOutIPAddress(string) {
  if (!!string) {
    const r = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

    const t = string.match(r);

    return t[0];
  }
}

function convertHttpUrlToWebsocket(url) {
  if (!url.includes("http")) {
    url = "http://" + url;
  }
  const urlInstance = new URL(url);
  const protocol = urlInstance.protocol;
  if (protocol === "https:") {
    urlInstance.protocol = "wss:";
  } else {
    urlInstance.protocol = "ws:";
  }

  return urlInstance.href.replace(/\/?$/, "");
}

module.exports = {
  convertHttpUrlToWebsocket,
  sanitizeURL,
  parseOutIPAddress,
  isValidHttpUrl,
  isValidWebsocketUrl
};
