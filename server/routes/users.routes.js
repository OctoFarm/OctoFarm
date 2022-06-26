const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const {
  fetchUsers,
  createUser,
  deleteUser,
  resetPassword,
  editUser
} = require("../api/users.api.js");
const { validateParamsMiddleware } = require("../middleware/validators");
const M_VALID = require("../constants/validate-mongo.constants");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const Logger = require("../handlers/logger");
const { listActiveClientsRes } = require("../services/server-side-events.service");
const logger = new Logger(LOGGER_ROUTE_KEYS.ROUTE_USERS);

// New user
router.post("/", async (req, res) => {
  const user = req.body;
  res.send(await createUser(user));
});

// Get user list
router.get("/:id", validateParamsMiddleware(M_VALID.MONGO_ID), async (req, res) => {
  const user = await User.findById(req.paramString("id"));
  res.send(user);
});

// Update user
router.patch("/:id", validateParamsMiddleware(M_VALID.MONGO_ID), async (req, res) => {
  const newUserInformation = {
    name: req.bodyString("name"),
    username: req.bodyString("username"),
    group: req.bodyString("group"),
    password: req.bodyString("password"),
    password2: req.bodyString("password2")
  };
  const id = req.paramString("id");

  if ("password" in newUserInformation) {
    return res.send(await resetPassword(id, newUserInformation));
  }
  if ("username" in newUserInformation) {
    return res.send(await editUser(id, newUserInformation));
  }
});

// Delete User
router.delete("/:id", validateParamsMiddleware(M_VALID.MONGO_ID), async (req, res) => {
  const id = req.paramString("id");
  res.send(await deleteUser(id));
});

router.get("/sessions", listActiveClientsRes);

module.exports = router;
