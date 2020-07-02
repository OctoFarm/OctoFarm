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
      let years = Math.floor(seconds / (360 * 365))


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
  static returnFilamentCost(filament, usageElement){
    let grams = usageElement.replace("g","")
    grams = parseFloat(grams)
    if(isNaN(grams)){
      return `No length to calculate from`
    }else{
      if(filament === null || filament == "None chosen..."){
        return `No filament to calculate from`
      }else{
        let cost = (filament.spools.price / filament.spools.weight) * grams
        return  cost.toFixed(2)
      }

    }
  }
  static returnPrintCost(costSettings, time){
    if(typeof costSettings === "undefined"){
      //Attempt to update cost settings in history...
      return "No cost settings to calculate from"
    }else{
      // calculating electricity cost
      let powerConsumption = parseFloat(costSettings.powerConsumption);
      let costOfElectricity = parseFloat(costSettings.electricityCosts);
      let costPerHour = powerConsumption * costOfElectricity;
      let estimatedPrintTime = time / 3600;  // h
      let electricityCost = costPerHour * estimatedPrintTime;
      // calculating printer cost
      let purchasePrice = parseFloat(costSettings.purchasePrice);
      let lifespan = parseFloat(costSettings.estimateLifespan);
      let depreciationPerHour = lifespan > 0 ? purchasePrice / lifespan : 0;
      let maintenancePerHour = parseFloat(costSettings.maintenanceCosts);
      let printerCost = (depreciationPerHour + maintenancePerHour) * estimatedPrintTime;
      // assembling string
      let estimatedCost = electricityCost + printerCost;
      return estimatedCost.toFixed(2);
    }



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
