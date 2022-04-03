module.exports = {
  REQUEST_TYPE: {
    GET: "get",
    POST: "post",
    PATCH: "patch",
    DELETE: "delete",
    WEBSOCKET: "websocket",
    PING_PONG: "ping_pong"
  },
  REQUEST_KEYS: {
    LAST_RESPONSE: "lastResponseTimes",
    FAILED_RESPONSE: "totalRequestsFailed",
    SUCCESS_RESPONSE: "totalRequestsSuccess",
    RETRY_REQUESTED: "totalRetries",
    CONNECTION_FAILURES: "connectionFailures",
    TOTAL_PING_PONG: "totalPingPong"
  }
};
