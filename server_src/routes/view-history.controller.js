const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const prettyHelpers = require("../../views/partials/functions/pretty.js");

const viewHistory = ({ serverVersion, printersStore, octoFarmPageTitle, historyCache }) => ({
  index: async (req, res) => {
    const printers = await printersStore.listPrintersFlat();

    const { history, stats } = historyCache.getHistoryCache();

    res.render("history", {
      user: {
        name: req.user.name,
        group: req.user.group
      },
      version: serverVersion,
      octoFarmPageTitle: octoFarmPageTitle,
      printerCount: printers.length,
      history,
      printStatistics: stats,
      helpers: prettyHelpers,
      page: "History"
    });
  }
});

// prettier-ignore
module.exports = createController(viewHistory)
  .prefix("/history")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("", "index");
