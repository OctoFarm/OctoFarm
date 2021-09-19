const { createController } = require("awilix-express");
const { AppConstants } = require("../app.constants");
const { ensureCurrentUserAndGroup } = require("../middleware/users");

const amIAliveAPI = () => ({
  index: async (req, res) => {
    res.json({
      ok: true
    });
  }
});

// prettier-ignore
module.exports = createController(amIAliveAPI)
  .prefix(AppConstants.apiRoute + "/amialive")
  .before([ensureCurrentUserAndGroup])
  .get("", "index");
