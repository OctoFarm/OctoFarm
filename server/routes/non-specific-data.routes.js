const express = require("express");

const router = express.Router();

const { returnPatreonData } = require("../services/patreon.service");

router.get("/patreons", (req, res) => {
  res.send(returnPatreonData());
});

module.exports = router;
