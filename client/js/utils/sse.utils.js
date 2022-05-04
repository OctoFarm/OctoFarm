import { parse } from "flatted";

export const asyncParse = async function (str) {
  try {
    return parse(str);
  } catch (e) {
    return false;
  }
};
export const isFunction = function (functionToCheck) {
  return (
    functionToCheck && {}.toString.call(functionToCheck) === "[object Function]"
  );
};

export const debounce = function (func, wait) {
  let timeout;
  let waitFunc;
  return function () {
    if (isFunction(wait)) {
      waitFunc = wait;
    } else {
      waitFunc = function () {
        return wait;
      };
    }

    const context = this,
      args = arguments;
    const later = function () {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, waitFunc());
  };
};
