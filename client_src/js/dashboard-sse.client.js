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

const Flatted = (function (Primitive, primitive) {
  const Flatted = {
    parse: function parse(text, reviver) {
      const input = JSON.parse(text, Primitives).map(primitives);
      const value = input[0];
      const $ = reviver || noop;
      const tmp =
        typeof value === "object" && value
          ? revive(input, new Set(), value, $)
          : value;
      return $.call({ "": tmp }, "", tmp);
    }
  };

  return Flatted;

  function noop(key, value) {
    return value;
  }

  function revive(input, parsed, output, $) {
    return Object.keys(output).reduce(function (output, key) {
      const value = output[key];
      if (value instanceof Primitive) {
        const tmp = input[value];
        if (typeof tmp === "object" && !parsed.has(tmp)) {
          parsed.add(tmp);
          output[key] = $.call(output, key, revive(input, parsed, tmp, $));
        } else {
          output[key] = $.call(output, key, tmp);
        }
      } else output[key] = $.call(output, key, value);
      return output;
    }, output);
  }

  function primitives(value) {
    return value instanceof Primitive ? Primitive(value) : value;
  }

  function Primitives(key, value) {
    return typeof value === primitive ? new Primitive(value) : value;
  }
})(String, "string");
var parse = Flatted.parse;
