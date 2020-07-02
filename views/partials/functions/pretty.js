const _ = require("lodash");

const bytes = function(a, b) {
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
};

const calculatePercent = function(use, total) {
  let percent = (use / total) * 100;
  return Math.round(percent);
};
const generateTime = function(seconds) {
  let string = "";
  if (seconds === undefined || isNaN(seconds) || seconds === null) {
    string = "Done";
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
};
const historyTotals = function(history){

  let historyFileNames = []
  let historyPrinterNames = []
  let historySpools = []
  let paths = [];

  history.forEach(hist => {
    historyFileNames.push(hist.printHistory.fileName.replace(".gcode", ""));
    historyPrinterNames.push(hist.printHistory.printerName.replace(/ /g, "_"));
    if(typeof hist.printHistory.job !== 'undefined'){
      let path = hist.printHistory.job.file.path.substring(0, hist.printHistory.job.file.path.lastIndexOf("/"))
      if(path != ''){
        paths.push(path);
      }
    }
    if(hist.printHistory.filamentSelection != null && typeof hist.printHistory.filamentSelection !== 'undefined' && typeof hist.printHistory.filamentSelection.spools !== 'undefined'){
      historySpools.push(
          hist.printHistory.filamentSelection.spools.profile.material.replace(/ /g, "_")
      );
    }

  })
  return {
    pathList: paths.filter(function (item, i, ar) {
      return ar.indexOf(item) === i;
    }),
    fileNames: historyFileNames.filter(function (item, i, ar) {
      return ar.indexOf(item) === i;
    }),
    printerNames: historyPrinterNames.filter(function (item, i, ar) {
      return ar.indexOf(item) === i;
    }),
    spools: historySpools.filter(function (item, i, ar) {
      return ar.indexOf(item) === i;
    }),

  };

}
const filamentTotals = function(profiles, spools, filamentManager){
  let materials = [];
  let materialBreak = [];
  profiles.forEach(profile => {
    materials.push(profile.profile.material.replace(/ /g, "_"));
    let profileID = null
    if(filamentManager){
      profileID = profile.profile.index
    }else{
      profileID = profile._id
    }
    material = {
      name: profile.profile.material.replace(/ /g, "_"),
      weight: [],
      used: [],
      price: [],
    }
    materialBreak.push(material)
  })
  materialBreak = _.uniqWith(materialBreak, _.isEqual)

  let used = [];
  let total = [];
  let price = [];

  spools.forEach(spool => {
    used.push(parseFloat(spool.spools.used))
    total.push(parseFloat(spool.spools.weight))
    price.push(parseFloat(spool.spools.price))
    let profInd = null;
    if(filamentManager){
      profInd = _.findIndex(profiles, function(o) { return o.profile.index == spool.spools.profile; });
    }else{
      profInd = _.findIndex(profiles, function(o) { return o._id == spool.spools.profile; });
    }

    let index = _.findIndex(materialBreak, function(o) { return o.name == profiles[profInd].profile.material.replace(/ /g, "_"); });

    materialBreak[index].weight.push(parseFloat(spool.spools.weight));
    materialBreak[index].used.push(parseFloat(spool.spools.used));
    materialBreak[index].price.push(parseFloat(spool.spools.price));
  })
  materialBreakDown = []
  materialBreak.forEach(material => {
    let mat = {
      name: material.name,
      used: material.used.reduce((a, b) => a + b, 0),
      total: material.weight.reduce((a, b) => a + b, 0),
      price: material.price.reduce((a, b) => a + b, 0),
    }
    materialBreakDown.push(mat)
  })

  return {
    materialList: materials.filter(function (item, i, ar) {
      return ar.indexOf(item) === i;
    }),
    used: used.reduce((a, b) => a + b, 0),
    total: total.reduce((a, b) => a + b, 0),
    price: price.reduce((a,b) => a + b, 0),
    profileCount: profiles.length,
    spoolCount: spools.length,
    materialBreakDown: materialBreakDown
  };

}

module.exports = {
  generateBytes: bytes,
  generateTime: generateTime,
  calculatePercent: calculatePercent,
  historyTotals: historyTotals,
  filamentTotals: filamentTotals
};
