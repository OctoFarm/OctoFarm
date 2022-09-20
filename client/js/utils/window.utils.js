export const reloadWindow = async () => {
  if (location.href.includes('submitEnvironment')) {
    const hostName = window.location.protocol + '//' + window.location.host + '';
    window.location.replace(hostName);
  } else {
    window.location.reload();
  }
};

export const isInViewport = (el) => {
  const rect = el.getBoundingClientRect(),
    vWidth = window.innerWidth || document.documentElement.clientWidth,
    vHeight = window.innerHeight || document.documentElement.clientHeight,
    efp = function (x, y) {
      return document.elementFromPoint(x, y);
    };

  // Return false if it's not in the viewport
  if (rect.right < 0 || rect.bottom < 0 || rect.left > vWidth || rect.top > vHeight) return false;

  return (
    el.contains(efp(rect.left, rect.top)) ||
    el.contains(efp(rect.right, rect.top)) ||
    el.contains(efp(rect.right, rect.bottom)) ||
    el.contains(efp(rect.left, rect.bottom))
  );
};
