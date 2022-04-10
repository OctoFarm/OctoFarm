const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-API");

const { stringify } = require("flatted");
let clientList = [];
const UNKNOWN_USER = "Administrator";

const addClientConnection = (req, res) => {
  // Set necessary headers to establish a stream of events
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: 0,
    Connection: "keep-alive"
  };
  res.writeHead(200, headers);
  res.write("\n");

  // Add a new client that just connected
  // Store the id and the whole response object with a clone of the user information
  // Limitations it doesn't update user information, don't think it's needed
  const id = Date.now();
  const client = {
    id,
    res,
    user: Object.assign({}, req.user)
  };
  clientList.push(client);

  logger.info(
    `${client?.user?.name ? client.user.name : UNKNOWN_USER} has connected to the endpoint.`
  );

  // When the connection is closed, remove the client from the subscribers
  req.on("close", () => {
    logger.info(
      `${client?.user?.name ? client.user.name : UNKNOWN_USER} has disconnected from the endpoint.`
    );
    removeClient(id);
  });

  req.on("error", (e) => {
    logger.warning(
      `${
        client?.user?.name ? client.user.name : UNKNOWN_USER
      } has disconnected from the endpoint: ${e}`
    );
    removeClient(id);
  });
};

const removeClient = (id) => {
  clientList = clientList.filter((client) => client.id !== id);
};

const listActiveClients = (req, res) => {
  const currentActiveClientList = clientList.map((client) => {
    return {
      connectionDate: client.id,
      userName: client?.user?.name ? client.user.name : UNKNOWN_USER,
      group: client.user.group
    };
  });
  return res.json(currentActiveClientList);
};
/**
 *
 * @param id Object ID relating to either files / printers
 * @param type Message type so the client knows what to do with it
 * @param message The actual message object the client has to deal with. 1 key 1 value only.
 */
const notifySubscribers = (id, type, message) => {
  if ((typeof message === "object" || Array.isArray(message)) && message !== null) {
    // Send a message to each subscriber
    const payload = {
      type,
      id,
      message
    };

    clientList.forEach((client) => {
      client.res.write(`retry: ${10000} \n`);
      client.res.write(`id: ${id}\n`);
      client.res.write(`type: ${type}\n`);
      client.res.write(`data: ${stringify(payload)} \n\n`);
    });
  }
};

module.exports = {
  addClientConnection,
  notifySubscribers,
  listActiveClients
};
