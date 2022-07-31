const ALLOWED_SYSTEM_CHECKS = () => {
  return Object.assign(
    {},
    {
      VERSION: "version",
      USERS: "users",
      FILES: "files",
      STATE: "state",
      PROFILE: "profile",
      SETTINGS: "settings",
      SYSTEM: "system",
      SYSTEM_INFO: "systemInfo",
      PLUGINS: "plugins",
      UPDATES: "updates",
      OCTOPI: "octopi"
    }
  );
};
const systemChecks = () => {
  return Object.assign(
    {},
    {
      scanning: {
        version: {
          status: "danger",
          date: null
        },
        users: {
          status: "danger",
          date: null
        },
        files: {
          status: "danger",
          date: null
        },
        state: {
          status: "danger",
          date: null
        },
        profile: {
          status: "danger",
          date: null
        },
        settings: {
          status: "danger",
          date: null
        },
        system: {
          status: "danger",
          date: null
        },
        systemInfo: {
          status: "danger",
          date: null
        },
        plugins: {
          status: "danger",
          date: null
        },
        updates: {
          status: "danger",
          date: null
        },
        octopi: {
          status: "danger",
          date: null
        }
      }
    }
  );
};
const tempTriggersDefaults = () => {
  return Object.assign(
    {},
    {
      heatingVariation: 1,
      coolDown: 30
    }
  );
};
const webCamSettings = () => {
  return Object.assign(
    {},
    {
      bitrate: "10000k",
      cacheBuster: false,
      ffmpegCommandline:
        '{ffmpeg} -r {fps} -i "{input}" -vcodec {videocodec} -threads {threads} -b:v {bitrate} -f {containerformat} -y {filters} "{output}"',
      ffmpegPath: null,
      ffmpegThreads: 1,
      ffmpegVideoCodec: "libx264",
      flipH: false,
      flipV: false,
      rotate90: false,
      snapshotSslValidation: true,
      snapshotTimeout: 5,
      snapshotUrl: null,
      streamRatio: "16:9",
      streamTimeout: 5,
      streamUrl: null,
      timelapseEnabled: true,
      watermark: true,
      webcamEnabled: true
    }
  );
};

const systemCommands = () => {
  return Object.assign(
    {},
    {
      commands: {
        serverRestartCommand: "",
        systemRestartCommand: "",
        systemShutdownCommand: ""
      }
    }
  );
};

module.exports = {
  systemChecks,
  tempTriggersDefaults,
  systemCommands,
  webCamSettings,

  ALLOWED_SYSTEM_CHECKS
};
