export const reloadWindow = async () => {
  if (location.href.includes("submitEnvironment")) {
    const hostName =
      window.location.protocol + "//" + window.location.host + "";
    window.location.replace(hostName);
  } else {
    window.location.reload();
  }
};

export const isInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
