const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const isDocker = require("is-docker");
const { AppConstants } = require("../app.constants");
const { isPm2 } = require("../utils/env.utils");

const serverInformationAPI = ({ octofarmUpdateService, PrintersStore }) => ({
  index: async (req, res) => {
    let softwareUpdateNotification = octofarmUpdateService.getUpdateNotificationIfAny();

    res.json({
      isDockerContainer: isDocker(),
      isPm2: isPm2(),
      os: process.env.OS,
      air_gapped: softwareUpdateNotification.air_gapped,
      current_version: softwareUpdateNotification.current_version,
      octoprint_versions: PrintersStore.getOctoPrintVersions()
    });
  }
});

// prettier-ignore
module.exports = createController(serverInformationAPI)
    .prefix(AppConstants.apiRoute + "/server-info")
    .before([ensureAuthenticated])
    .get("", "index");
