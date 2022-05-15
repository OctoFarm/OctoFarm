const { getPrinterStoreCache } = require("../cache/printer-store.cache");

const MIN_LENGTH_0 = "minLength:0";
const MAX_PRINTER_ARRAY = `maxLength:${getPrinterStoreCache().getPrinterCount() + 100}`; //Leave some headroom incase printers are been added when action occurs
const API_MAX_LENGTH = "maxLength:32";
const API_MIN_LENGTH = "minLength:32";
const STRING_MAX_LENGTH = "maxLength:50";

module.exports = {
  PRINTER_ID: {
    id: ["string", "mongoose_object_id"]
  },
  NEW_PRINTER: {
    settingsAppearance: "settings_appearance",
    printerURL: ["required", "string", "url"],
    camURL: ["string", "url"],
    apikey: ["required", "string", API_MIN_LENGTH, API_MAX_LENGTH],
    group: ["string", MIN_LENGTH_0, STRING_MAX_LENGTH]
  },
  PRINTER_ID_LIST: {
    idList: ["required", "array", MIN_LENGTH_0], //INVESTIGATE why max length doesn't work here!?
    "idList.*": ["required", "string", "mongoose_object_id"]
  },
  UPDATE_PRINTERS: {
    infoList: ["required", "array", MIN_LENGTH_0],
    "infoList.*._id": ["required", "mongoose_object_id"],
    "infoList.*.apikey": ["required", "string", API_MIN_LENGTH, API_MAX_LENGTH],
    "infoList.*.camURL": ["string", "url"],
    "infoList.*.group": ["string", MIN_LENGTH_0],
    "infoList.*.printerURL": ["required", "string", "url"],
    "infoList.*.settingsAppearance": "settings_appearance"
  },
  FILE_SYNC: {
    id: ["required", "string", "mongoose_object_id"],
    filePath: ["string"]
  },
  HOUSE_KEEPING: {
    id: ["required", "string", "mongoose_object_id"],
    days: ["required"]
  },
  BULK_FILE_DELETE: {
    id: ["required", "string", "mongoose_object_id"],
    "pathList.*": ["required", "string"]
  }
};
