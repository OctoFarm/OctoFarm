const express = require("express");

const router = express.Router();

const { ensureAuthenticated } = require("../middleware/auth");

const RoomData = require("../models/RoomData.js");

router.post("/roomData", ensureAuthenticated, async (req, res) => {
  //REFACTOR needs to split open the body and validate it.
  const enviromentData = req.body;
  const databaseData = await new RoomData(enviromentData);
  databaseData.save();
});

module.exports = router;
