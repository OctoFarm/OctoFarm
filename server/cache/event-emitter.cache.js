const EventEmitterService = require("../services/event-emitter.service");

let eventEmitterState = undefined;

function getEventEmitterCache() {
  if (!!eventEmitterState) {
    return eventEmitterState;
  } else {
    eventEmitterState = new EventEmitterService();
    return eventEmitterState;
  }
}

module.exports = { getEventEmitterCache };
