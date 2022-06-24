//const MjpegDecoder = require("mjpeg-decoder");
const MjpegCamera = require("mjpeg-camera");
const { SettingsClean } = require("../settings-cleaner.service");
const Logger = require("../../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../../constants/logger.constants");
const { notifySubscribers } = require("../server-side-events.service");
const { MESSAGE_TYPES } = require("../../constants/sse.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_MJPEG_DECODER);

class MjpegDecoderService {
  #currentStreams;

  constructor() {
    this.#currentStreams = [];
  }

  #isCameraURLDecodingAlready(id) {
    if (this.#currentStreams[id]) {
      return true;
    }
    return false;
  }

  async setupNewCamera(id, camURL) {
    if (!this.#isCameraURLDecodingAlready(id)) {
      this.#currentStreams[id] = {
        camURL,
        decoder: new MjpegCamera({
          url: camURL,
          // interval: SettingsClean.returnCameraSettings().updateInterval,
          motion: true
        }),
        lastFrame: null
      };
      this.#currentStreams[id].lastFrame = await this.#currentStreams[id].decoder.start();
      this.#addListenersToCamera(id);
    }
  }

  #addListenersToCamera(id) {
    this.#currentStreams[id].decoder.on("frame", (frame, seq) => {
      this.fireNewCameraImageEvent(id, frame, seq);
    });
    this.#currentStreams[id].decoder.start();
  }

  fireNewCameraImageEvent(id, frame, seq) {
    this.#currentStreams[id].lastFrame = frame;
    notifySubscribers("cameraURL", MESSAGE_TYPES.NEW_CAMERA_IMAGE, {
      printerID: id,
      cameraURL: `/camera/${id}?${seq}`
    });
  }

  getNewestFrame(id) {
    return this.#currentStreams[id].lastFrame;
  }

  stopAllDecoders() {
    for (const stream of this.#currentStreams) {
      stream.decoder.stop();
    }
  }
}

module.exports = {
  MjpegDecoderService
};
