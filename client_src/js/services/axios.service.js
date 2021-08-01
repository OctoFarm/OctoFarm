import axios from "axios";
import { ApplicationError } from "../exceptions/application-error.handler";
import { HTTPError } from "../exceptions/octofarm-api.exceptions";
import { ClientErrors } from "../exceptions/octofarm-client.exceptions";
import { handleServerHTMLRedirect } from "../utils/validators/client-response.validator";

// axios request interceptor
axios.interceptors.request.use(
  function (config) {
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
    if (response?.data) {
      const htmlDetect = handleServerHTMLRedirect(response.data);
      const overrides = {
        message: `${ClientErrors.INVALID_SERVER_RESPONSE.message}: ${response.config.url}`
      };
      if (!htmlDetect) throw new ApplicationError(ClientErrors.INVALID_SERVER_RESPONSE, overrides);
    }

    return response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    switch (error.response.status) {
      case 0:
        throw new ApplicationError(HTTPError.NO_CONNECTION);
      case 400:
        throw new ApplicationError(HTTPError.BAD_REQUEST);
      case 401:
        throw new ApplicationError(HTTPError.UNAUTHORIZED);
      case 403:
        throw new ApplicationError(HTTPError.FORBIDDEN);
      case 404:
        throw new ApplicationError(HTTPError.RESOURCE_NOT_FOUND);
      case 500:
        throw new ApplicationError(HTTPError.INTERNAL_SERVER_ERROR);
      case 502:
        throw new ApplicationError(HTTPError.BAD_GATEWAY);
      case 503:
        throw new ApplicationError(HTTPError.SERVICE_UNAVAILABLE);
      case 504:
        throw new ApplicationError(HTTPError.GATEWAY_TIMEOUT);
      default:
        throw new ApplicationError(HTTPError.UNKNOWN);
    }
  }
);

export default class Axios {
  static async get(path) {
    const url = new URL(path, window.location.origin).href;
    return axios.get(url).then((res) => {
      return res.data;
    });
  }

  static async post(path, data) {
    const url = new URL(path, window.location.origin).href;
    return axios.post(url, data).then((res) => {
      return res.data;
    });
  }

  static async delete(path) {
    const url = new URL(path, window.location.origin).href;
    return axios.delete(url).then((res) => {
      return res.data;
    });
  }
  static async patch(path, data) {
    const url = new URL(path, window.location.origin).href;
    return axios.delete(url, data).then((res) => {
      return res.data;
    });
  }
}
