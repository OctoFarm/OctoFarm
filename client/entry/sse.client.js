import { asyncParse, debounce } from '../js/utils/sse.utils';
import { ClientErrors } from '../js/exceptions/octofarm-client.exceptions';
import { ApplicationError } from '../js/exceptions/application-error.handler';

// reconnectFrequencySeconds doubles every retry
let reconnectFrequencySeconds = 1;
let evtSource;
let evtURL;

const reconnectFunc = debounce(
  function () {
    setupEventSource();
    // Double every attempt to avoid overwhelming server
    reconnectFrequencySeconds *= 2;
    // Max out at ~1 minute as a compromise between user experience and server load
    if (reconnectFrequencySeconds >= 64) {
      reconnectFrequencySeconds = 64;
    }
  },
  function () {
    return reconnectFrequencySeconds * 1000;
  }
);

function setupEventSource(url) {
  if (url) {
    evtURL = url;
  } else {
    url = evtURL;
  }
  evtSource = new EventSource(url);
  evtSource.onmessage = async function (e) {
    if (!!e.data) {
      const res = await asyncParse(e.data);
      postMessage(res);
    }
  };
  evtSource.onopen = function (e) {
    console.debug('Connected to ' + url);
    // Reset reconnect frequency upon successful connection
    reconnectFrequencySeconds = 1;
  };
  evtSource.onerror = async function (e) {
    console.error('Issue with SSE connection... ');
    postMessage(false);
    evtSource.close();
    reconnectFunc();
    const errorObject = ClientErrors.SILENT_ERROR;
    errorObject.message = `SSE Error - ${e}`;
    throw new ApplicationError(errorObject);
  };
  evtSource.onclose = async function () {
    console.warning('Closed SSE connection... ');
    postMessage(false);
    evtSource.close();
    reconnectFunc();
  };
}

self.addEventListener(
  'message',
  function (e) {
    const url = e.data.url;
    setupEventSource(url);
  },
  false
);
