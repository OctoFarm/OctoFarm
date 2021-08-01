function validateServerResponse(response) {
  // Don't really like this, there may be a better way but currently the server re-directs everything and was hard to detect otherwise.
  let isString = Object.prototype.toString.call(response) === "[object String]";

  return !(isString && response.includes("<!DOCTYPE html>"));
}

function validatePath(pathname) {
  let url = pathname;
  if (!pathname?.includes("http")) {
    url = new URL(pathname, window.location.origin);
  } else {
    url = new URL(url);
  }

  return url.href;
}

export { validateServerResponse, validatePath };
