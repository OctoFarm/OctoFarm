import axios from "axios";
import { ClientError } from "../exceptions/client-error.handler";
import { ServerError } from "../exceptions/server-error.handler";
import { PrinterClientError } from "../exceptions/printer-client-error.handler";
import { HTTPError } from "../exceptions/api.exceptions";
import { PrinterApiErrors } from "../exceptions/printer-api.exceptions";
import { ClientErrors } from "../exceptions/client.exceptions";
import { validateServerResponse, validatePath } from "../utils/validators/api.validator";
import AmIAliveService from "./amialive.service";
import { TIMEOUTS } from "../constants/timer.constants";

const CancelToken = axios.CancelToken;

function octofarmErrorResponseCheck(response) {
  switch (response.status) {
    case 0:
      throw new ServerError(HTTPError.NO_CONNECTION, response.data);
    case 400:
      throw new ServerError(HTTPError.BAD_REQUEST, response.data);
    case 401:
      throw new ServerError(HTTPError.UNAUTHORIZED, response.data);
    case 403:
      throw new ServerError(HTTPError.FORBIDDEN, response.data);
    case 404:
      throw new ServerError(HTTPError.RESOURCE_NOT_FOUND, response.data);
    case 500:
      throw new ServerError(HTTPError.INTERNAL_SERVER_ERROR, response.data);
    case 502:
      throw new ServerError(HTTPError.BAD_GATEWAY, response.data);
    case 503:
      throw new ServerError(HTTPError.SERVICE_UNAVAILABLE, response.data);
    case 504:
      throw new ServerError(HTTPError.GATEWAY_TIMEOUT, response.data);
    default:
      const overrides = {
        message: `${HTTPError.UNKNOWN.statusCode}: "${response.status}"`
      };
      Object.assign(overrides, response.data);
      throw new ServerError(HTTPError.UNKNOWN, overrides);
  }
}
function printerClientErrorResponseCheck(response) {
  // Make sure to capture anything that connects to a printer and doesn't get a response. Safe guard as most of this should be dealt with by the offline state.
  if (!response?.status) throw new PrinterClientError(HTTPError.NO_CONNECTION);

  switch (response.status) {
    case 0:
      throw new PrinterClientError(PrinterApiErrors.NO_CONNECTION, response.data);
    case 400:
      throw new PrinterClientError(PrinterApiErrors.BAD_REQUEST, response.data);
    case 401:
      throw new PrinterClientError(PrinterApiErrors.UNAUTHORIZED, response.data);
    case 403:
      throw new PrinterClientError(PrinterApiErrors.FORBIDDEN, response.data);
    case 404:
      throw new PrinterClientError(PrinterApiErrors.RESOURCE_NOT_FOUND, response.data);
    case 409:
      throw new PrinterClientError(PrinterApiErrors.CONFLICT, response.data);
    case 415:
      throw new PrinterClientError(PrinterApiErrors.UNSUPPORTED_MEDIA_TYPE, response.data);
    case 500:
      throw new PrinterClientError(PrinterApiErrors.INTERNAL_SERVER_ERROR, response.data);
    case 502:
      throw new PrinterClientError(PrinterApiErrors.BAD_GATEWAY, response.data);
    case 503:
      throw new PrinterClientError(PrinterApiErrors.SERVICE_UNAVAILABLE, response.data);
    case 504:
      throw new PrinterClientError(PrinterApiErrors.GATEWAY_TIMEOUT, response.data);
    default:
      const overrides = {
        message: `${PrinterApiErrors.UNKNOWN.statusCode}: "${response.status}"`
      };
      Object.assign(overrides, response.data);
      throw new ServerError(PrinterApiErrors.UNKNOWN, overrides);
  }
}

// axios request interceptor
axios.interceptors.request.use(
  function (config) {
    // Cancel all calls going forward if server offline and route is not am I alive
    if (!AmIAliveService.getStatus() && config.url !== AxiosService.serverAliveRoute)
      return {
        ...config,
        cancelToken: new CancelToken((cancel) =>
          cancel("Server offline, cancelling repeated requests")
        )
      };

    // Validate the config has a url
    if (!validatePath(config.url)) {
      const overrides = {
        message: `${ClientErrors.INVALID_URL_SUPPLIED.message}: "${config.url}"`
      };
      throw new ClientError(ClientErrors.INVALID_URL_SUPPLIED, overrides);
    }

    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// axios response interceptor
axios.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data

    // This is due to the (*) redirect. Might be worth looking into an alternative as it makes detecting invalid requests a problem.
    if (!validateServerResponse(response.data)) {
      const overrides = {
        message: `${ClientErrors.INVALID_SERVER_RESPONSE.message}: "${response.config.url}"`
      };
      throw new ClientError(ClientErrors.INVALID_SERVER_RESPONSE, overrides);
    }

    return response.data;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    // console.log("ERROR", error);
    // Anything else will be OctoFarm server/client communications.
    if (error?.response?.status) {
      // Calls here will be OctoFarm issues
      octofarmErrorResponseCheck(error.response);
    } else {
      // Silence the SERVER_ALIVE_CHECK_FAILED error
      if (AmIAliveService.getStatus()) {
        // This captures the failure from the am I alive check.
        AmIAliveService.setStatus(false);
        AmIAliveService.showModal();
        throw new ServerError(HTTPError.SERVER_ALIVE_CHECK_FAILED);
      }
    }
  }
);

export default class AxiosService {
  static serverAliveRoute = "/api/amialive";
  // Tried this check inside of the Octofarm Client Service but the errors didn't capture in a decent order causing typing errors
  static serverAliveCheck() {
    return axios.get(this.serverAliveRoute, { timeout: TIMEOUTS.AXIOS }).then((res) => {
      // This comes back undefined during the bubbling up to check the error so just making sure to not raise extra errors
      if (res) {
        AmIAliveService.setStatus(true); // Service is alive
        AmIAliveService.connectionRestored();
        return res;
      }
    });
  }
  static get(path, options) {
    return axios.get(path, options);
  }

  static post(path, data, options) {
    return axios.post(path, data, options);
  }

  static delete(path, options) {
    return axios.delete(path, options);
  }

  static put(path, data, options) {
    return axios.put(path, data, options);
  }

  static patch(path, data, options) {
    return axios.patch(path, data, options);
  }
}
