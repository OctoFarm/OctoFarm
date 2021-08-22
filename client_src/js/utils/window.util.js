export function reloadCurrentWindow() {
  if (location.href.includes("submitEnvironment")) {
    const hostName = window.location.protocol + "//" + window.location.host + "";
    window.location.replace(hostName);
  } else {
    window.location.reload();
  }
}
