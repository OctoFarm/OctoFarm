module.exports = {
  PRINTER_ID: {
    i: ["printer_id"]
  },
  NEW_PRINTER: {
    settingsAppearance: "settings_appearance",
    printerURL: ["required", "string", "url"],
    camURL: ["string", "url"],
    apikey: ["required", "string", "minLength:32", "maxLength:32"],
    group: ["string", "minLength:0", "maxLength:50"]
  },
  PRINTER_ID_LIST: {
    idList: ["required", "array"],
    "idList.*": ["required", "string"]
  },
  UPDATE_PRINTERS: {
    infoList: ["required", "array"],
    "infoList.*._id": ["required", "printer_id"],
    "infoList.*.apikey": ["required", "string", "minLength:32", "maxLength:32"],
    "infoList.*.camURL": ["string", "url"],
    "infoList.*.group": ["string", "minLength:0", "maxLength:50"],
    "infoList.*.printerURL": ["required", "string", "url"],
    "infoList.*.settingsAppearance": "settings_appearance"
  }
};