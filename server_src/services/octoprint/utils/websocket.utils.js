const { byteCount } = require("../../../utils/benchmark.util");

let DEBUG = false;

const parseOctoPrintWebsocketMessage = (message) => {
  const packet = JSON.parse(message);
  const header = Object.keys(packet)[0];
  if (DEBUG) {
    console.log(`DEBUG WS ['${header}', ${byteCount(message)} bytes]`);
  }
  return {
    header,
    data: packet[header]
  };
};

module.exports = {
  parseOctoPrintWebsocketMessage
};
