import { ApplicationError } from "../../exceptions/application-error.handler";
import { ClientErrors } from "../../exceptions/octofarm-client.exceptions";

// Don't really like this, there may be a better way but currently the server re-directs everything and was hard to detect otherwise.
function validateServerReponse(response) {
  let isString = Object.prototype.toString.call(response) === "[object String]";

  return !(isString && response.includes("<!DOCTYPE html>"));
}

function validatePath(pathname) {
  return new URL(pathname, window.location.origin);
}

export { validateServerReponse, validatePath };
