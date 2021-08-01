// Don't really like this, there may be a better way but currently the server re-directs everything and was hard to detect otherwise.
function handleServerHTMLRedirect(response) {
  let isString = Object.prototype.toString.call(response) === "[object String]";
  if (isString && response.includes("<!DOCTYPE html>")) {
    return false;
  } else {
    return response;
  }
}

export { handleServerHTMLRedirect };
