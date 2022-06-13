const express = require("express");

const router = express.Router();

const { returnPatreonData } = require("../services/patreon.service");
const { DATA } = require("../constants/route.constants");

router.get(DATA.PATREONS, (req, res) => {
  res.send(returnPatreonData());
});

module.exports = router;
