const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-API");

const { stringify } = require("flatted");
let clientList = [];
const UNKNOWN_USER = "Administrator";
let count = 0;
const addClientConnection = (req, res) => {
  // Set necessary headers to establish a stream of events
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: 0,
    Connection: "keep-alive"
  };
  res.writeHead(200, headers);

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
    logger.error(
      `${client?.user?.name ? client.user.name : UNKNOWN_USER} has disconnected from the endpoint.`
    );
    removeClient(id);
  });
};

const removeClient = (id) => {
  clientList = clientList.filter((client) => client.id !== id);
};

// TODO map, add to system as a callable endpoint so admins can see users connected...
const listClients = (req, res) => {
  console.log(clients);
  return res.json(clients);
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
      client.res.write(`data: ${stringify(payload)} \n\n`);
    });
  }
};

// setInterval(() => {
//   if (count === 0) {
//     notifySubscribers("TRex_Tail_B_D.gcode", "file_update", {
//       key: "fileDate",
//       value: "I Was updated from SSE!"
//     });
//     count = 1;
//   } else {
//     notifySubscribers("TRex_Tail_B_D.gcode", "file_update", {
//       key: "fileDate",
//       value: "I was changed from SSE!"
//     });
//     count = 0;
//   }
// }, 5000);

module.exports = {
  addClientConnection,
  notifySubscribers,
  listClients
};
