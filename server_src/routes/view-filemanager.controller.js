const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const prettyHelpers = require("../../views/partials/functions/pretty.js");

const viewFileManager = ({
  serverVersion,
  printersStore,
  currentOperationsCache,
  fileCache,
  octoFarmPageTitle
}) => ({
  index: async (req, res) => {
    const printers = printersStore.listPrintersFlat();

    const currentOperations = currentOperationsCache.getCurrentOperations();
    const fileStatistics = fileCache.getStatistics();

    res.render("filemanager", {
      name: req.user.name,
      userGroup: req.user.group,
      version: serverVersion,
      page: "Printer Manager",
      octoFarmPageTitle,
      printerCount: printers.length,
      helpers: prettyHelpers,
      currentOperationsCount: currentOperations.count,
      fileStatistics
    });
  }
});

// prettier-ignore
module.exports = createController(viewFileManager)
  .prefix("/filemanager")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("", "index");
