const { getPrinterStoreCache } = require("../cache/printer-store.cache");

const MIN_LENGTH_0 = "minLength: 0";

module.exports = {
  PRINTER_ID: {
    i: ["string", "mongoose_object_id"]
  },
  NEW_PRINTER: {
    settingsAppearance: "settings_appearance",
    printerURL: ["required", "string", "url"],
    camURL: ["string", "url"],
    apikey: ["required", "string", "minLength:32", "maxLength:32"],
    group: ["string", MIN_LENGTH_0, "maxLength:50"]
  },
  PRINTER_ID_LIST: {
    idList: ["required", "array", MIN_LENGTH_0], //INVESTIGATE why max length doesn't work here!?
    "idList.*": ["required", "string", "mongoose_object_id"]
  },
  UPDATE_PRINTERS: {
    infoList: ["required", "array", "minLength:0", "maxLength:1000"],
    "infoList.*._id": ["required", "mongoose_object_id"],
    "infoList.*.apikey": ["required", "string", "minLength:32", "maxLength:32"],
    "infoList.*.camURL": ["string", "url"],
    "infoList.*.group": ["string", MIN_LENGTH_0, "maxLength:50"],
    "infoList.*.printerURL": ["required", "string", "url"],
    "infoList.*.settingsAppearance": "settings_appearance"
  }
};
