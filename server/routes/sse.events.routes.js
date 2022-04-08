const express = require("express");

const router = express.Router();
const { ensureCurrentUserAndGroup } = require("../middleware/users.js");
const { addClientConnection } = require("../services/server-side-events.service");

router.get("/", ensureCurrentUserAndGroup, addClientConnection);

module.exports = router;
