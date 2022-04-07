const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-Events");
const { eventListConstants, EVENT_ID_MAP } = require("../constants/event.constants")

class EventEmitterService {
  #listeners = {}; // key-value pair
  // We only ever need 1 event listener at a time per printer. Event ID's are always `{printer._id}-{eventName}`
  #addListener(event, fn) {
    if (!this.#listeners[event]) {
      this.#listeners[event] = fn;
      this.#logEventCount();
    }
    return this;
  }

  get(printerID){
    const eventList = [];
    Object.keys(this.#listeners).forEach((event) => {
      if(event.includes(printerID)){
        const eventSplit = event.split("-");
        eventList.push(eventListConstants[EVENT_ID_MAP[eventSplit[1]]]);
      }
    })
    return eventList;
  }

  on(event, fn) {
    logger.warning("Adding new event listener", event);
    return this.#addListener(event, fn);
  }

  #removeListener(event) {
    let lis = this.#listeners[event];

    if (!lis) return this;

    delete this.#listeners[event];

    this.#logEventCount();
    return this;
  }
  off(event, fn) {
    logger.debug("Turning event listener off", event);
    return this.#removeListener(event, fn);
  }

  once(event, fn) {
    const onceWrapper = (...args) => {
      fn(...args);
      this.#removeListener(event);
    };
    this.#addListener(event, onceWrapper);
    return this;
  }

  emit(event, ...args) {
    let fns = this.#listeners[event];

    if (!fns) return false;
    logger.warning("Firing event listener", event);

    fns(...args);

    return true;
  }

  listenerCount() {
    let fns = Object.keys(this.#listeners) || [];
    return fns.length;
  }

  #logEventCount() {
    logger.info(`Currently ${this.listenerCount()} events registered.`);
  }
}

module.exports = EventEmitterService;
