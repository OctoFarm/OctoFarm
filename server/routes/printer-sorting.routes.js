const express = require("express");

const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");

const { updateSorting, updateFilter } = require("../services/front-end-sorting.service.js");
const {
  returnCurrentOrdering,
  updateOrdering
} = require("../services/current-operations-order.service");

router.get("/updateFilter/:filter", ensureAuthenticated, async (req, res) => {
  updateFilter(req.paramString("filter"));
  res.sendStatus(200);
});

router.get("/updateSorting/:sorting", ensureAuthenticated, async (req, res) => {
  updateSorting(req.paramString("sorting"));
  res.sendStatus(200);
});

router.get("/currentOpSorting", ensureAuthenticated, async (req, res) => {
  res.send(returnCurrentOrdering());
});

router.post("/currentOpSorting", ensureAuthenticated, async (req, res) => {
  updateOrdering(req.body);
  res.sendStatus(200);
});

module.exports = router;
