const express = require("express");

const router = express.Router();
const { addClientConnection } = require("../services/server-side-events.service");

router.get("/", addClientConnection);

module.exports = router;
