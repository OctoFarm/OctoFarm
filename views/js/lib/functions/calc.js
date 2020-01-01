//Calculation Functions
export default class Calculate {
  //Generate a random string
  static randomString() {
    let random = Math.random()
      .toString(36)
      .substr(2, 5);
    return random;
  }
  //Convert miliseconds to Days, Hours, Minutes
  static generateTime(seconds) {
    let string = "";
    if (seconds === undefined) {
      string = "No Time Estimate";
    } else {
      let days = Math.floor(seconds / (3600 * 24));

      seconds -= days * 3600 * 24;
      let hrs = Math.floor(seconds / 3600);

      seconds -= hrs * 3600;
      let mnts = Math.floor(seconds / 60);

      seconds -= mnts * 60;
      seconds = Math.floor(seconds);

      string =
        days +
        " Days, " +
        hrs +
        " Hrs, " +
        mnts +
        " Mins, " +
        seconds +
        " Seconds";

      if (string.includes("0 Days")) {
        string = string.replace("0 Days,", "");
      }
      if (string.includes("0 Hrs")) {
        string = string.replace(" 0 Hrs,", "");
      }
      if (string.includes("0 Mins")) {
        string = string.replace(" 0 Mins,", "");
      }
      if (mnts > 0 || hrs > 0 || days > 0 || seconds > 0) {
      } else {
        string = string.replace("0 Seconds", "Done");
      }
    }

    return string;
  }
  //Check if values are between another value.
  static isBetween(n, a, b) {
    return (n - a) * (n - b) <= 0;
  }

  static bytes(a, b) {
    if (0 == a) return "0 Bytes";
    var c = 1024,
      d = b || 2,
      e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
      f = Math.floor(Math.log(a) / Math.log(c));
    return parseFloat((a / Math.pow(c, f)).toFixed(d)) + " " + e[f];
  }

  static sortObjValues(key, order) {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        // property doesn't exist on either object
        return 0;
      }

      const varA = typeof a[key] === "string" ? a[key].toUpperCase() : a[key];
      const varB = typeof b[key] === "string" ? b[key].toUpperCase() : b[key];

      let comparison = 0;
      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return order === "desc" ? comparison * -1 : comparison;
    };
  }
}
