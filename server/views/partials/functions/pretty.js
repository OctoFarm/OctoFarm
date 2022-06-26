const _ = require("lodash");

const bytes = function (a, b) {
  if (a === undefined || isNaN(a) || a === null) {
    return "No File Estimate";
  } else {
    if (0 == a) return "0 Bytes";
    const c = 1024,
      d = b || 2,
      e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
      f = Math.floor(Math.log(a) / Math.log(c));
    return parseFloat(a / Math.pow(c, f)).toFixed(d) + " " + e[f];
  }
};

const calculatePercent = function (use, total) {
  const percent = (use / total) * 100;
  return Math.round(percent);
};

const generateTime = function (seconds) {
  let string = "";
  if (seconds === undefined || isNaN(seconds) || seconds === null) {
    string = "No Time Estimate";
  } else {
    const days = Math.floor(seconds / (3600 * 24));

    seconds -= days * 3600 * 24;
    const hrs = Math.floor(seconds / 3600);

    seconds -= hrs * 3600;
    const mnts = Math.floor(seconds / 60);

    seconds -= mnts * 60;
    seconds = Math.floor(seconds);

    string = `${days}d, ${hrs}h, ${mnts}m, ${seconds}s`;

    if (mnts == 0) {
      if (string.includes("0m")) {
        string = string.replace(" 0m,", "");
      }
    }
    if (hrs == 0) {
      if (string.includes("0h")) {
        string = string.replace(" 0h,", "");
      }
    }
    if (days == 0) {
      if (string.includes("0d")) {
        string = string.replace("0d,", "");
      }
    }
    if (mnts == 0 && hrs == 0 && days == 0 && seconds == 0) {
      string = string.replace("0s", seconds + "s");
    }
  }

  return string;
};

const returnProgressColour = function (percent, reverse) {
  if (percent < 45) {
    return reverse ? "bg-danger" : "bg-success";
  } else if (percent < 75) {
    return "bg-warning";
  } else {
    return reverse ? "bg-success" : "bg-danger";
  }
};

const generateMilisecondsTime = function (miliseconds) {
  let seconds = miliseconds / 1000;
  let string = "";
  if (seconds === undefined || isNaN(seconds) || seconds === null) {
    string = "No Interval";
  } else {
    const days = Math.floor(seconds / (3600 * 24));

    seconds -= days * 3600 * 24;
    const hrs = Math.floor(seconds / 3600);

    seconds -= hrs * 3600;
    const mnts = Math.floor(seconds / 60);

    seconds -= mnts * 60;
    seconds = Math.floor(seconds);

    string = `${days}d, ${hrs}h, ${mnts}m, ${seconds}s`;

    if (mnts == 0) {
      if (string.includes("0m")) {
        string = string.replace(" 0m,", "");
      }
    }
    if (hrs == 0) {
      if (string.includes("0h")) {
        string = string.replace(" 0h,", "");
      }
    }
    if (days == 0) {
      if (string.includes("0d")) {
        string = string.replace("0d,", "");
      }
    }
    if (seconds == 0) {
      string = string.replace(", 0s", "");
    }
    if (mnts == 0 && hrs == 0 && days == 0 && seconds == 0) {
      string = string.replace("0s", miliseconds + " ms");
    }
    if (!miliseconds) {
      string = "No Interval";
    }
    return string;
  }
};

const replaceGithubIcons = (text) => {
  return text
    .replace(/:hammer:/g, '<i class="fa-solid fa-hammer text-purple"></i>')
    .replace(/:stars:/g, '<i class="fa-solid fa-star text-purple"></i>')
    .replace(/:persevere:/g, '<i class="fa-solid fa-dove text-purple"></i>')
    .replace(/:dash:/g, '<i class="fa-solid fa-person-running text-purple"></i>')
    .replace(/:link:/g, '<i class="fa-solid fa-link text-purple"></i>')
    .replace(/:boom:/g, '<i class="fa-solid fa-bomb text-purple"></i>')
    .replace(/:scroll:/g, '<i class="fa-solid fa-arrow-rotate-left text-purple"></i>')
    .replace(/:key:/g, '<i class="fa-solid fa-key text-purple"></i>')
    .replace(/:curly_loop:/g, '<i class="fa-solid fa-display text-purple"></i>')
    .replace(/:x:/g, '<i class="fa-solid fa-xmark text-purple"></i>')
    .replace(/server:/g, '<i class="fa-solid fa-server text-purple"></i>')
    .replace(/client:/g, '<i class="fa-solid fa-display text-purple"></i>');
};

module.exports = {
  generateBytes: bytes,
  generateTime: generateTime,
  calculatePercent: calculatePercent,
  generateMilisecondsTime,
  returnProgressColour,
  replaceGithubIcons
};
