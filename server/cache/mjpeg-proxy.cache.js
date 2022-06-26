const { MjpegDecoderService } = require("../services/printers/mjpeg-decoder.service");

let mjpegProxyStore = undefined;

function getMjpegProxyCache() {
  if (!!mjpegProxyStore) {
    return mjpegProxyStore;
  } else {
    mjpegProxyStore = new MjpegDecoderService();
    return mjpegProxyStore;
  }
}

module.exports = {
  getMjpegProxyCache
};
