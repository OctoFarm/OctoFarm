const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../middleware/auth");
const { AppConstants } = require("../app.constants");

class SortingFilteringController {
  #sortingFilteringCache;

  constructor({ sortingFilteringCache }) {
    this.#sortingFilteringCache = sortingFilteringCache;
  }

  updateFilter(req, res) {
    console.log("Updating filter", req.params.filter);
    this.#sortingFilteringCache.updateFilter(req.params.filter);
    res.sendStatus(200);
  }

  updateSorting(req, res) {
    this.#sortingFilteringCache.updateSorting(req.params.sorting);
    res.sendStatus(200);
  }
}

// prettier-ignore
module.exports = createController(SortingFilteringController)
  .prefix(AppConstants.apiRoute + "/client")
  .before([ensureAuthenticated])
  .patch("/filter/:filter", "updateFilter")
  .patch("/sorting/:sorting", "updateSorting");
