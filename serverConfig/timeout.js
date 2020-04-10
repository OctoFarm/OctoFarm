module.exports = {
    webSocketRetry: 5000,
    apiTimeout: 1000,
    apiRetryCutoff: 10000,
};
//Web Socket Retry: How often to poll for an offline websocket connection when lost.
//API Timeout: The timeout clause on the API, increase if your printers (mainly prusa) are having issues grabbing the initial connection.
//API Cutoff: The API will retry a connection until this timeout is met, Only change if instructed to do so.
