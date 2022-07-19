const { ALLOWED_SYSTEM_CHECKS } = require("../../printers/constants/printer-defaults.constants");
const octoPrintBase = "/";
const apiBase = octoPrintBase + "api";

const apiVersion = apiBase + "/version";
const apiUsers = apiBase + "/users";
const apiSettings = apiBase + "/settings";
const apiSystem = apiBase + "/system";
const apiSystemInfo = apiSystem + "/info";
const apiSystemCommands = apiSystem + "/commands";
const apiPrinterProfiles = apiBase + "/printerprofiles";
const apiConnection = apiBase + "/connection";
const apiPluginManager = apiBase + "/plugin/pluginmanager";
const apiSoftwareUpdateCheck = (force = false) =>
  octoPrintBase + "plugin/softwareupdate/check" + (force ? "?force=true" : "");
const apiFiles = (recursive = true) => apiBase + "/files?recursive=" + recursive;
const apiPluginPiSupport = apiBase + "/plugin/pi_support";

module.exports = {
  testingTheWaters: [
    {
      api: apiVersion,
      tickerMessage: "OctoPrint's version information",
      captureDataKeys: ["server"]
    }
  ],
  requiredApiCheckSequence: [
    {
      api: apiUsers,
      tickerMessage: "OctoPrint's user information",
      apiCheck: ALLOWED_SYSTEM_CHECKS().API,
      captureDataKeys: ["users"]
    },
    {
      api: apiSettings,
      tickerMessage: "OctoPrint's settings information",
      apiCheck: ALLOWED_SYSTEM_CHECKS().SETTINGS,
      captureDataKeys: [
        "api",
        "feature",
        "folder",
        "plugins",
        "scripts",
        "serial",
        "server",
        "system",
        "webcam",
        "appearance"
      ]
    },
    {
      api: apiSystemCommands,
      tickerMessage: "OctoPrint's system commands",
      apiCheck: ALLOWED_SYSTEM_CHECKS().SYSTEM,
      captureDataKeys: ["core"]
    },
    {
      api: apiPrinterProfiles,
      tickerMessage: "OctoPrint's printer profile data",
      apiCheck: ALLOWED_SYSTEM_CHECKS().PROFILE,
      captureDataKeys: ["profiles"]
    },
    {
      api: apiConnection,
      tickerMessage: "OctoPrint's printer connection data",
      apiCheck: ALLOWED_SYSTEM_CHECKS().STATE,
      captureDataKeys: ["current", "options"]
    }
  ],
  optionalApiCheckSequence: [
    {
      api: apiSystemInfo,
      tickerMessage: "OctoPrint's system information",
      apiCheck: ALLOWED_SYSTEM_CHECKS().SYSTEM_INFO,
      captureDataKeys: ["systeminfo"]
    },
    {
      api: apiPluginManager,
      tickerMessage: "OctoPrint's plugin information",
      apiCheck: ALLOWED_SYSTEM_CHECKS().PLUGINS,
      captureDataKeys: ["plugins"]
    },
    {
      api: apiSoftwareUpdateCheck(),
      tickerMessage: "OctoPrint's update information",
      apiCheck: ALLOWED_SYSTEM_CHECKS().UPDATES,
      captureDataKeys: ["information"]
    },
    {
      api: apiFiles(),
      tickerMessage: "OctoPrint's file lists",
      apiCheck: ALLOWED_SYSTEM_CHECKS().FILES,
      captureDataKeys: ["free", "total", "files"]
    },
    {
      api: apiPluginPiSupport,
      tickerMessage: "OctoPrint's file lists",
      apiCheck: ALLOWED_SYSTEM_CHECKS().FILES,
      captureDataKeys: ["octopi"]
    }
  ]
};
