export const reloadWindow = async () => {
  if (location.href.includes('submitEnvironment')) {
    const hostName = window.location.protocol + '//' + window.location.host + '';
    window.location.replace(hostName);
  } else {
    window.location.reload();
  }
};

function posY(elm) {
  var test = elm,
    top = 0;

  while (!!test && test.tagName.toLowerCase() !== 'body') {
    top += test.offsetTop;
    test = test.offsetParent;
  }

  return top;
}

function viewPortHeight() {
  var de = document.documentElement;

  if (!!window.innerWidth) {
    return window.innerHeight;
  } else if (de && !isNaN(de.clientHeight)) {
    return de.clientHeight;
  }

  return 0;
}

function scrollY() {
  if (window.pageYOffset) {
    return window.pageYOffset;
  }
  return Math.max(document.documentElement.scrollTop, document.body.scrollTop);
}

export const isInViewport = (el) => {
  var vpH = viewPortHeight(), // Viewport Height
    st = scrollY(), // Scroll Top
    y = posY(el);

  return y > vpH + st;
};
