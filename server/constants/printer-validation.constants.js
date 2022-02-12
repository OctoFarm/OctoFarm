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
  DELETE_PRINTERS: {
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
// {
//   "0": {
//   "_id": "61f749be18a5349701139a15",
//       "apikey": "4D8B445D749543668AE5E06BF438E066",
//       "camURL": "",
//       "group": "1.7.2",
//       "printerURL": "http://10.50.0.103",
//       "settingsAppearance": {
//     "color": "default",
//         "colorTransparent": false,
//         "defaultLanguage": "_default",
//         "name": "Showcase of Cottage Cheese That's even longer than expected",
//         "showFahrenheitAlso": false
//   }
// }
