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
    if (seconds === undefined || isNaN(seconds) || seconds === null) {
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

      if (mnts == 0) {
        if (string.includes("0 Mins")) {
          string = string.replace(" 0 Mins,", "");
        }
      }
      if (hrs == 0) {
        if (string.includes("0 Hrs")) {
          string = string.replace(" 0 Hrs,", "");
        }
      }
      if (days == 0) {
        if (string.includes("0 Days")) {
          string = string.replace("0 Days,", "");
        }
      }
      if (mnts == 0 && hrs == 0 && days == 0 && seconds == 0) {
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
    let string = "";
    if (a === undefined || isNaN(a) || a === null) {
      return (string = "No File Estimate");
    } else {
      if (0 == a) return "0 Bytes";
      var c = 1024,
        d = b || 2,
        e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
        f = Math.floor(Math.log(a) / Math.log(c));
      return parseFloat((a / Math.pow(c, f)).toFixed(d)) + " " + e[f];
    }
  }
}
