const { parse } = require("flatted");

async function asyncParse(str) {
  try {
    const info = parse(str);
    return info;
  } catch (e) {
    return false;
  }
}

const source = new EventSource("/dashboardInfo/get/");

source.onmessage = async function (e) {
  if (e.data != null) {
    const res = await asyncParse(e.data);
    postMessage(res);
  }
};
source.onerror = function () {
  postMessage(false);
};
source.onclose = function () {
  postMessage(false);
};
