function sanitizeURL(url) {
  if (!url) return;
  return new URL(url).href;
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
  sanitizeURL
};
