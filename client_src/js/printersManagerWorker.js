const { parse } = require("flatted");

async function asyncParse(str) {
  try {
    const info = await parse(str);
    return info;
  } catch (e) {
    return false;
  }
}

const source = new EventSource("/printersInfo/get/");

// source.addEventListener("ping", function(event) {
//     if (e.data != null) {
//         let res = asyncParse(e.data)
//         postMessage(res);
//     }
// });
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
