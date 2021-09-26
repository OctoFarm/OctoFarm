const SECOND_MS = 1000;
const MINUTE_MS = SECOND_MS * 60;
const HOUR_MS = MINUTE_MS * 60;
const DAY_MS = HOUR_MS * 24;

module.exports = {
  TIMERS: {
    AMIALIVE: SECOND_MS,
    AMIALIVE_MODAL: SECOND_MS,
    UPDATECHECK: 5 * MINUTE_MS
  },
  TIMEOUTS: {
    AXIOS: 2 * SECOND_MS
  }
};
