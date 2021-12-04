module.exports = {
  REQUEST_TYPE: {
    GET: "get",
    POST: "post",
    PATCH: "patch",
    WEBSOCKET: "websocket"
  },
  REQUEST_KEYS: {
    LAST_RESPONSE: "lastResponseTimes",
    FAILED_RESPONSE: "totalRequestsFailed",
    SUCCESS_RESPONSE: "totalRequestsSuccess",
    RETRY_REQUESTED: "totalRetries"
  }
};
