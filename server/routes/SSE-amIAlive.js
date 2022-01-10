const express = require("express");

const router = express.Router();
const { ensureCurrentUserAndGroup } = require("../config/users.js");
const { stringify } = require("flatted");

let clientId = 0;
const clients = {}; // <- Keep a map of attached clients
let interval = false;
const string = stringify({ ok: true });

router.get("/", ensureCurrentUserAndGroup, async (req, res) => {
  //req.socket.setTimeout(Number.MAX_VALUE);
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: 0,
    Connection: "keep-alive"
  });
  res.write("retry:" + 10000 + "\n");
  res.write("data: " + string + "\n\n");
  (function (clientId) {
    clients[clientId] = res; // <- Add this client to those we consider "attached"
    req.on("close", function () {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
    req.on("error", function () {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
  })(++clientId);
  //console.log("Client: " + Object.keys(clients));
});

if (interval === false) {
  interval = setInterval(async function () {
    for (clientId in clients) {
      clients[clientId].write("retry:" + 10000 + "\n");
      clients[clientId].write("data: " + string + "\n\n"); // <- Push a message to a single attached client
    }
  }, 500);
}

module.exports = router;
