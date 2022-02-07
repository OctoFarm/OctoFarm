// Calculation Functions
// REFACTOR this can be shared between server and client
export default class Calculate {
  // Generate a random string
  static randomString() {
    const random = Math.random().toString(36).substr(2, 5);
    return random;
  }

  static perc(amount, rounding = 2) {
    return `${amount?.toFixed(rounding) || 0}%`;
  }

  // Apply tofixed if not null
  static toFixed(amount, fractional = 0) {
    return amount?.toFixed(fractional) || 0;
  }

  // Convert miliseconds to Days, Hours, Minutes
  static generateTime(seconds) {
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

      if (mnts === 0) {
        if (string.includes("0m")) {
          string = string.replace(" 0m,", "");
        }
      }
      if (hrs === 0) {
        if (string.includes("0h")) {
          string = string.replace(" 0h,", "");
        }
      }
      if (days === 0) {
        if (string.includes("0d")) {
          string = string.replace("0d,", "");
        }
      }
      if (mnts === 0 && hrs === 0 && days === 0 && seconds === 0) {
        string = string.replace("0s", "Done");
      }
    }

    return string;
  }

  // Check if values are between another value.
  static isBetween(n, a, b) {
    return (n - a) * (n - b) <= 0;
  }

  static bytes(a, b) {
    let string = "";
    if (a === undefined || isNaN(a) || a === null) {
      return (string = "No File Estimate");
    }
    if (a == 0) return "0 Bytes";
    const c = 1024;
    const d = b || 2;
    const e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const f = Math.floor(Math.log(a) / Math.log(c));
    return `${parseFloat((a / Math.pow(c, f)).toFixed(d))} ${e[f]}`;
  }

  static dateClean(date) {
    date = new Date(date);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    return `${days[date.getDay()]} ${
      months[date.getMonth()]
    } ${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  }
  static generateCost(cost) {
    if (cost) {
      return cost.toFixed(2);
    } else {
      return 0;
    }
  }
  static getPercentage(done, total) {
    return ((100 * done) / total).toFixed(0);
  }
  static firstDayOfMonth() {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  static lastDayOfMonth() {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
}
