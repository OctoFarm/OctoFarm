export function reloadCurrentWindow() {
  if (
    location.href.includes("submitEnvironment") ||
    location.href.includes("update-environmen" + "")
  ) {
    const hostName = window.location.protocol + "//" + window.location.host + "";
    window.location.replace(hostName);
  } else {
    window.location.reload();
  }
}
