const { createController } = require("awilix-express");
const { AppConstants } = require("../app.constants");
const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { isPm2, isNodemon, isNode } = require("../utils/env.utils");
const isDocker = require("is-docker");
const { ensureAuthenticated } = require("../middleware/auth");
const { prettyPrintArray } = require("../utils/pretty-print.utils.js");
const { GROUPS } = require("../constants/group.constants");

const serverInformationAPI = ({ systemInfoStore, printersStore, octofarmUpdateService }) => ({
  /**
   * Call slow system information from system info runner
   */
  info: async (req, res) => {
    const systemInformation = await systemInfoStore.querySystemInfo();
    res.send(systemInformation);
  },
  /**
   * Check if theres a system update available, without running server side check
   */
  updateReady: async (req, res) => {
    const softwareUpdateNotification = octofarmUpdateService.getUpdateNotificationIfAny();
    // ensure update_available can only be true when Administrator group found
    if (req?.user?.group !== GROUPS.ADMIN) {
      softwareUpdateNotification.update_available = false;
    }
    res.send(softwareUpdateNotification);
  },
  /**
   * Generate the required information for pre-filling a github issue form
   */
  githubIssue: async (req, res) => {
    const softwareUpdateNotification = octofarmUpdateService.getUpdateNotificationIfAny();
    const printerVersions = printersStore.getOctoPrintVersions();

    // ensure update_available can only be true when Administrator group found
    if (req?.user?.group !== GROUPS.ADMIN) {
      softwareUpdateNotification.update_available = false;
    }

    res.send({
      isDockerContainer: isDocker(),
      isNodemon: isNodemon(),
      isNode: isNode(),
      isPm2: isPm2(),
      os: process.env.OS,
      update: softwareUpdateNotification,
      printerVersions: prettyPrintArray(printerVersions)
    });
  }
});

// prettier-ignore
module.exports = createController(serverInformationAPI)
  .prefix(AppConstants.apiRoute + "/server")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("/info", "info")
  .get("/update-ready", "updateReady")
  .get("/github-issue", "githubIssue");
