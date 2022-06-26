const MjpegDecoder = require("mjpeg-decoder");
const { SettingsClean } = require("../settings-cleaner.service");
const Logger = require("../../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../../constants/logger.constants");
const { notifySubscribers, listActiveClientsCount } = require("../server-side-events.service");
const { MESSAGE_TYPES } = require("../../constants/sse.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_MJPEG_DECODER);

class MjpegDecoderService {
  #currentStreams;
  #cameraInterval;

  constructor() {
    this.#currentStreams = [];
    this.#setupCameraInterval();
  }

  #setupCameraInterval() {
    logger.info("Setting up camera interval...");
    this.#cameraInterval = setInterval(async () => {
      for (const [key] of Object.entries(this.#currentStreams)) {
        if (listActiveClientsCount() > 0) {
          await this.#fireNewCameraImageEvent(key);
        }
      }
    }, SettingsClean.returnCameraSettings().updateInterval);
  }

  destroyCameraInterval() {
    logger.info("Destroying camera interval...");
    clearInterval(this.#cameraInterval);
    return "Destroyed camera interval...";
  }

  #isCameraURLDecodingAlready(id) {
    return !!this.#currentStreams[id];
  }

  async #fireNewCameraImageEvent(id) {
    this.#currentStreams[id].lastFrame = await this.#currentStreams[id].decoder.takeSnapshot();
    logger.debug("Captured last frame, updating client...");
    notifySubscribers("cameraURL", MESSAGE_TYPES.NEW_CAMERA_IMAGE, {
      printerID: id,
      cameraURL: `/camera/${id}?${Date.now()}`
    });
  }

  async setupNewCamera(id, camURL) {
    if (!this.#isCameraURLDecodingAlready(id)) {
      this.#currentStreams[id] = {
        decoder: new MjpegDecoder(camURL),
        lastFrame: null
      };
      this.#currentStreams[id].lastFrame = await this.#currentStreams[id].decoder.takeSnapshot();
    }
  }

  getNewestFrame(id) {
    return this.#currentStreams[id].lastFrame;
  }
}

module.exports = {
  MjpegDecoderService
};
