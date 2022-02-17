const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-API");

const { stringify } = require("flatted");
let clientList = [];
const UNKNOWN_USER = "Unknown User";

const addClientConnection = (req, res) => {
  // Set necessary headers to establish a stream of events
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive"
  };
  res.writeHead(200, headers);

  // Add a new client that just connected
  // Store the id and the whole response object
  const id = Date.now();
  const client = {
    id,
    res,
    user: req.user
  };
  clientList.push(client);

  logger.info(`${res?.user?.name ? req.user.name : UNKNOWN_USER} has connected to the endpoint.`);

  // When the connection is closed, remove the client from the subscribers
  req.on("close", () => {
    logger.info(
      `${res?.user?.name ? req.user.name : UNKNOWN_USER} has disconnected from the endpoint.`
    );
    removeClient(id, "Client closed the connection");
  });

  req.on("error", (e) => {
    logger.error(
      `${res?.user?.name ? req.user.name : UNKNOWN_USER} has disconnected from the endpoint.`
    );
    removeClient(id, `Client disconnected due to error: ${e}`);
  });
};

const removeClient = (id, reason) => {
  clientList = clientList.filter((client) => client.id !== id);
};

// TODO map, add to system as a callable endpoint so admins can see users connected...
const listClients = (req, res) => {
  return res.json(clients);
};

const notifySubscribers = (message) => {
  // Send a message to each subscriber
  clientList.forEach((client) => client.res.write(`data: ${stringify(message)}\n\n`));
};

module.exports = {
  addClientConnection,
  notifySubscribers,
  listClients
};
