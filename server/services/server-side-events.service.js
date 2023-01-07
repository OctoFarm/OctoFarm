const Logger = require('../handlers/logger');
const { LOGGER_ROUTE_KEYS } = require('../constants/logger.constants');
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_SSE);
const {capitaliseFirstLetter} = require("../utils/string.utils")

const { stringify } = require('flatted');
let clientList = [];
const UNKNOWN_USER = 'Administrator';

const addClientConnection = (req, res) => {
  // Set necessary headers to establish a stream of events
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: 0,
    Connection: 'keep-alive',
  };
  res.writeHead(200, headers);
  res.write('\n');

  // Add a new client that just connected
  // Store the id and the whole response object with a clone of the user information
  // Limitations it doesn't update user information, don't think it's needed
  if (!req?.user) {
    // On login page... no user available... do not register connection
    return;
  }

  const id = Date.now();
  const client = {
    id,
    res,
    user: JSON.parse(JSON.stringify(req?.user)),
    endpoint: req.query.currentPage ? JSON.parse(JSON.stringify(capitaliseFirstLetter(req.query.currentPage.replace("/", "")))) : 'unknown endpoint',
    ip: req.socket.remoteAddress,
    forwardIp: req.headers['x-forwarded-for'],
  };
  clientList.push(client);

  logger.info(
    `${client?.user?.name ? client.user.name : UNKNOWN_USER} has connected to the endpoint.`
  );

  // When the connection is closed, remove the client from the subscribers
  req.on('close', () => {
    logger.warning(
      `${client?.user?.name ? client.user.name : UNKNOWN_USER} has disconnected from the endpoint.`
    );
    removeClient(id);
  });

  req.on('error', (e) => {
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

const listActiveClientsRes = (_req, res) => {
  const currentActiveClientList = clientList.map((client) => {
    return {
      connectionDate: client.id,
      userName: client?.user?.name ? client.user.name : UNKNOWN_USER,
      group: client.user.group,
      endpoint: client.endpoint,
      ip: client.ip,
      forwardIp: client.forwardIp,
    };
  });
  return res.json(currentActiveClientList);
};
const listActiveClientsCount = () => {
  return clientList.length;
};
/**
 *
 * @param id Object ID relating to either files / printers / element in UI.
 * @param type Message type so the client knows what to do with it
 * @param message The actual message object the client has to deal with. 1 key 1 value only.
 * @param printerInfo If required by message values, then send printer info. Not a required key...
 */
const notifySubscribers = (id, type, message, printerInfo = undefined) => {
  if ((typeof message === 'object' || Array.isArray(message)) && message !== null) {
    // Send a message to each subscriber
    const payload = {
      type,
      id,
      dataLength: null,
      message,
      printerInfo
    };

    const stringifiedLoad = stringify(payload);

    clientList.forEach((client) => {
      client.res.write(`retry: ${10000}\n`);
      client.res.write(`data: ${stringify(payload)}\n\n`);
    });
  }
};

module.exports = {
  addClientConnection,
  notifySubscribers,
  listActiveClientsRes,
  listActiveClientsCount,
};
