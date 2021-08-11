const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const prettyHelpers = require("../../views/partials/functions/pretty.js");

const viewFilament = ({
  serverVersion,
  historyCache,
  filamentCache,
  printersStore,
  octoFarmPageTitle,
  settingsStore
}) => ({
  index: async (req, res) => {
    const { stats: historyStats } = historyCache.getHistoryCache();
    const printers = printersStore.listPrintersFlat();
    const serverSettings = settingsStore.getServerSettings();

    const statistics = filamentCache.getStatistics();
    const spools = filamentCache.getSpools();
    const profiles = filamentCache.getProfiles();

    res.render("filament", {
      name: req.user.name,
      userGroup: req.user.group,
      version: serverVersion,
      printerCount: printers.length,
      page: "Filament Manager",
      octoFarmPageTitle,
      helpers: prettyHelpers,
      serverSettings,
      spools,
      profiles,
      statistics,
      historyStats
    });
  }
});

// prettier-ignore
module.exports = createController(viewFilament)
  .prefix("/filament")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("", "index");
